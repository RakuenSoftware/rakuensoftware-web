import { spawn } from 'node:child_process';
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
