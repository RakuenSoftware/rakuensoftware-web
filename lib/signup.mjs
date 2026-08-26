import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/* aimee cloud signup.
 *
 * Handled here, on the web host, rather than by the aimee cloud API. The form
 * is a marketing-site concern and has nothing to do with a knowledge base:
 * sending it to the API host would put unauthenticated public traffic on the
 * machine that holds customer corpora, and would need CORS, a preflight and a
 * second origin in the allowlist to do something this process can do on its
 * own, same-origin, with none of that.
 *
 * The record on disk is the source of truth; mail is a convenience. A failed
 * send is reported but never loses the signup. */

const MAX_EMAIL = 254; /* RFC 5321 */
const MAX_NAME = 120;
const MAX_NOTE = 1000;

/* Deliberately loose. A stricter pattern than "something@something.something"
 * rejects real addresses (plus-tagging, new TLDs, unusual local parts), and
 * the only way to truly validate an address is to send to it, which is exactly
 * what happens next. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(input) {
  if (input == null || typeof input !== 'object') return { error: 'Invalid request' };

  /* A field people never see and bots fill in. Rejecting is reported to the
   * caller as SUCCESS: a bot told it was caught tries again differently, one
   * that believes it worked does not. */
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return { honeypot: true };
  }

  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const note = typeof input.note === 'string' ? input.note.trim() : '';

  if (email === '' || email.length > MAX_EMAIL || !EMAIL.test(email)) {
    return { error: 'That does not look like an email address.' };
  }
  if (name.length > MAX_NAME || note.length > MAX_NOTE) {
    return { error: 'That is longer than we can accept.' };
  }
  /* The address and name are interpolated into mail headers below. A CR or LF
   * there lets a submitter forge a Bcc, a different Subject, or a second body.
   * The note goes in the body where it cannot forge a header regardless. */
  if (/[\r\n]/.test(email) || /[\r\n]/.test(name)) {
    return { error: 'That does not look like an email address.' };
  }
  return { signup: { email, name, note } };
}

export function renderMail({ to, from, signup, at, remoteIp, userAgent }) {
  const lines = [
    `To: ${to}`,
    `From: aimee cloud <${from}>`,
    `Subject: aimee cloud signup: ${signup.email}`,
    /* Replying answers the person who signed up, in one keystroke. */
    `Reply-To: ${signup.email}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    `${signup.email} wants a free knowledge base.`,
    '',
  ];
  if (signup.name !== '') lines.push(`Name:  ${signup.name}`);
  lines.push(`When:  ${at}`);
  if (remoteIp) lines.push(`From:  ${remoteIp}`);
  if (userAgent) lines.push(`Agent: ${userAgent.slice(0, 200)}`);
  if (signup.note !== '') {
    lines.push('', 'They said:', ...signup.note.split('\n').map((l) => `  ${l}`));
  }
  lines.push(
    '',
    'To set them up, on the aimee cloud host:',
    '  aimee-cloud create <tenant> -profile kb -tier free',
    '  aimee-cloud code-mint <tenant>      # a 24h single-use setup code',
    '',
  );
  return lines.join('\r\n');
}

/** Hand a message to the local MTA. Resolves on success, rejects with the
 *  transport's own complaint so a misconfigured relay is diagnosable. */
export function sendMail(message, { bin = process.env.SENDMAIL_BIN ?? '/usr/sbin/sendmail', timeoutMs = 20_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    /* -t reads recipients from the headers; -i stops a lone dot ending input. */
    const child = spawn(bin, ['-t', '-i'], { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      err ? reject(err) : resolvePromise();
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      /* Killing the child is not enough. If it spawned anything of its own, the
       * grandchild inherits these pipes and keeps them open, so the handles stay
       * alive and the process that gave up never becomes idle. Drop our ends. */
      child.stdin.destroy();
      child.stderr.destroy();
      finish(new Error(`${bin} timed out`));
    }, timeoutMs);

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', (e) => finish(e));
    child.on('close', (code) =>
      finish(code === 0 ? null : new Error(`${bin} exited ${code}: ${stderr.trim()}`)),
    );
    /* An MTA that rejects the message can exit before reading stdin, and
     * writing to a pipe nobody is reading raises EPIPE. Unhandled, that is an
     * uncaught exception that takes the whole web server down over one bad
     * signup. Swallow it here and let the exit code below decide the outcome,
     * since the child's own status is the better signal anyway. */
    child.stdin.on('error', () => {});
    child.stdin.end(message);
  });
}

/* Submit a message over SMTP to a local MTA.
 *
 * Preferred over the sendmail binary, and the reason is not taste. This service
 * runs with NoNewPrivileges=yes, which strips the setuid bit from
 * /usr/sbin/exim4 (mode 4755). sendmail then runs as the service user against a
 * spool owned by Debian-exim at mode 750 and fails with "Permission denied" —
 * while the same command run from a shell works, which is what makes it
 * confusing. No ReadWritePaths fixes it, because it is a privilege problem and
 * not a mount one, and the alternative was turning off NoNewPrivileges on a
 * public-facing web server to send an email.
 *
 * A TCP conversation with 127.0.0.1:25 needs no privileges at all, spawns no
 * child, and leaves the hardening intact.
 */
export function sendMailSmtp(message, { host = '127.0.0.1', port = 25, from, to, timeoutMs = 20_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    if (!from || !to) {
      reject(new Error('smtp: from and to are required'));
      return;
    }
    const socket = createConnection({ host, port });
    let settled = false;
    let buffer = '';
    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      err ? reject(err) : resolvePromise();
    };
    const timer = setTimeout(() => finish(new Error(`smtp: ${host}:${port} timed out`)), timeoutMs);

    /* Each step is a command and the reply code it expects IN RESPONSE. An
     * earlier version stored the code expected BEFORE sending, which put every
     * check one behind: DATA's 354 was tested against 2 and the send failed on
     * a correct server. */
    const steps = [
      { send: `EHLO ${host}\r\n`, expect: '2' },
      { send: `MAIL FROM:<${from}>\r\n`, expect: '2' },
      { send: `RCPT TO:<${to}>\r\n`, expect: '2' },
      { send: 'DATA\r\n', expect: '3' },
      { send: `${dotStuff(message)}\r\n.\r\n`, expect: '2' },
      { send: 'QUIT\r\n', expect: '2' },
    ];
    /* -1 means the server greeting, which arrives before anything is sent. */
    let step = -1;

    socket.on('error', (e) => finish(e));
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      buffer += chunk;
      /* A reply may be multi-line: continuation lines carry a hyphen after the
       * code, the final one a space. Wait for the final line before acting. */
      const lines = buffer.split('\r\n').filter((l) => l !== '');
      const last = lines[lines.length - 1];
      if (last == null || last.length < 4 || last[3] === '-') return;
      buffer = '';

      const expected = step === -1 ? '2' : steps[step].expect;
      if (!last.startsWith(expected)) {
        finish(new Error(`smtp: ${host}:${port} said: ${last}`));
        return;
      }
      step += 1;
      if (step >= steps.length) {
        finish(null);
        return;
      }
      socket.write(steps[step].send);
    });
  });
}

/* A body line consisting of a single dot ends the DATA phase, so any line
 * starting with one gets another. Without this a message can be truncated, or
 * its tail interpreted as SMTP commands. */
function dotStuff(message) {
  return message
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n');
}

/** Append one signup as a JSON line. The file is the source of truth. */
export async function recordSignup(path, record) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await appendFile(path, `${JSON.stringify(record)}\n`, { mode: 0o600 });
}

export async function countSignups(path) {
  try {
    const text = await readFile(path, 'utf8');
    return text.split('\n').filter((l) => l.trim() !== '').length;
  } catch {
    return 0;
  }
}
