import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  countSignups,
  recordSignup,
  renderMail,
  sendMail,
  validateSignup,
} from '../lib/signup.mjs';

test('accepts an ordinary submission and trims it', () => {
  const { signup } = validateSignup({ email: '  jo@example.com ', name: ' Jo ', note: ' a repo ' });
  assert.deepEqual(signup, { email: 'jo@example.com', name: 'Jo', note: 'a repo' });
});

test('rejects addresses that are not addresses', () => {
  for (const email of ['', 'nonsense', '@example.com', 'jo@', 'jo@example', 'a b@example.com']) {
    assert.ok(validateSignup({ email }).error, `accepted ${JSON.stringify(email)}`);
  }
});

test('accepts the real addresses a stricter pattern would reject', () => {
  for (const email of [
    'jo+aimee@example.com',
    'first.last@sub.example.co.uk',
    'someone@example.technology',
  ]) {
    assert.ok(validateSignup({ email }).signup, `rejected ${email}`);
  }
});

// The address and name are interpolated into mail headers. A newline there
// lets a submitter forge a Bcc, a Subject, or a second body.
test('refuses header injection', () => {
  assert.ok(validateSignup({ email: 'a@b.com\r\nBcc: victim@example.com' }).error);
  assert.ok(validateSignup({ email: 'a@b.com\nSubject: forged' }).error);
  assert.ok(validateSignup({ email: 'a@b.com', name: 'Jo\r\nBcc: victim@example.com' }).error);
});

test('enforces field limits', () => {
  assert.ok(validateSignup({ email: `${'a'.repeat(250)}@example.com` }).error);
  assert.ok(validateSignup({ email: 'a@b.com', name: 'n'.repeat(200) }).error);
  assert.ok(validateSignup({ email: 'a@b.com', note: 'x'.repeat(1200) }).error);
});

// A filled honeypot reports SUCCESS to the caller: a bot told it was caught
// tries again differently, one that thinks it worked does not.
test('honeypot is reported separately from an error', () => {
  const filled = validateSignup({ email: 'a@b.com', website: 'http://spam' });
  assert.equal(filled.honeypot, true);
  assert.equal(filled.error, undefined);
  // Whitespace is not "filled".
  assert.ok(validateSignup({ email: 'a@b.com', website: '   ' }).signup);
});

test('rejects a non-object body', () => {
  for (const input of [null, undefined, 'string', 42]) {
    assert.ok(validateSignup(input).error);
  }
});

test('the mail carries what an operator needs to act', () => {
  const mail = renderMail({
    to: 'ops@example.com',
    from: 'no-reply@example.com',
    signup: { email: 'jo@example.com', name: 'Jo', note: 'a rust monorepo' },
    at: '2026-08-26T12:00:00Z',
    remoteIp: '203.0.113.7',
    userAgent: 'Mozilla/5.0',
  });
  for (const want of [
    'To: ops@example.com',
    'Reply-To: jo@example.com',
    'Subject: aimee cloud signup: jo@example.com',
    'Jo',
    'a rust monorepo',
    '203.0.113.7',
    'aimee-cloud code-mint',
  ]) {
    assert.ok(mail.includes(want), `mail missing ${JSON.stringify(want)}`);
  }
  // Headers must be CRLF-terminated, and the body separated by a blank line.
  assert.ok(mail.includes('\r\n\r\n'));
});

test('optional fields are simply absent from the mail', () => {
  const mail = renderMail({
    to: 'ops@example.com',
    from: 'no-reply@example.com',
    signup: { email: 'jo@example.com', name: '', note: '' },
    at: '2026-08-26T12:00:00Z',
  });
  assert.ok(!mail.includes('Name:'));
  assert.ok(!mail.includes('They said:'));
});

test('records append as one JSON line each', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'signup-'));
  const file = join(dir, 'signups.jsonl');
  await recordSignup(file, { email: 'a@example.com', at: '1' });
  await recordSignup(file, { email: 'b@example.com', at: '2' });
  const lines = (await readFile(file, 'utf8')).trim().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).email, 'a@example.com');
  assert.equal(await countSignups(file), 2);
});

test('counting a file that does not exist is zero, not an error', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'signup-'));
  assert.equal(await countSignups(join(dir, 'nothing.jsonl')), 0);
});

// A misconfigured relay must be diagnosable rather than silently swallowed.
test('sendMail rejects when the transport fails', async () => {
  await assert.rejects(() => sendMail('To: a@b.com\r\n\r\nbody', { bin: '/bin/false' }));
  await assert.rejects(() => sendMail('x', { bin: '/nonexistent/sendmail' }));
});

// /bin/true ignores its arguments and exits 0 without reading stdin, so this
// also covers the EPIPE path: a transport that accepts but never reads must
// still resolve rather than crash the process.
test('sendMail resolves when the transport accepts', async () => {
  await sendMail('To: a@b.com\r\n\r\nbody', { bin: '/bin/true' });
});

test('the message actually reaches the transport, verbatim', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'signup-'));
  const out = join(dir, 'sent.eml');
  const stub = join(dir, 'sendmail');
  await writeFile(stub, `#!/bin/sh\ncat > ${out}\n`, { mode: 0o755 });

  const message = renderMail({
    to: 'ops@example.com',
    from: 'no-reply@example.com',
    signup: { email: 'jo@example.com', name: 'Jo', note: 'line one\nline two' },
    at: '2026-08-26T12:00:00Z',
  });
  await sendMail(message, { bin: stub });
  const sent = await readFile(out, 'utf8');
  assert.equal(sent, message);
  assert.ok(sent.includes('  line one'), 'the note should be indented in the body');
});

// A hung MTA must not hold an HTTP request open until the client gives up.
// The stub ignores its arguments, because a real sendmail is invoked with
// -t -i and a stand-in that rejects those tests the wrong failure.
test('sendMail gives up rather than hanging on a transport that never exits', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'signup-'));
  const stub = join(dir, 'hangs');
  await writeFile(stub, '#!/bin/sh\nexec sleep 30\n', { mode: 0o755 });
  await assert.rejects(() => sendMail('x', { bin: stub, timeoutMs: 100 }), /timed out/);
});

/* SMTP is the transport the deployment actually uses: the service runs with
 * NoNewPrivileges, which strips setuid from exim's sendmail, so a subprocess
 * cannot write the spool. These drive a stub server rather than a live MTA. */
import { createServer } from 'node:net';
import { sendMailSmtp } from '../lib/signup.mjs';

/** A minimal SMTP server that records what it was told. `replies` overrides the
 *  response to a given command verb, so a refusal can be simulated. */
function smtpStub(replies = {}) {
  const received = { commands: [], body: '' };
  const sockets = new Set();
  let inData = false;
  const server = createServer((socket) => {
    /* Tracked so close() can destroy them. server.close() only stops accepting
     * and waits for open connections, which left the event loop alive and made
     * the whole test FILE time out while every subtest passed. */
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8');
    socket.write('220 stub ESMTP\r\n');
    let buf = '';
    socket.on('data', (chunk) => {
      buf += chunk;
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (inData) {
          if (line === '.') {
            inData = false;
            socket.write('250 queued\r\n');
          } else {
            received.body += `${line}\r\n`;
          }
          continue;
        }
        received.commands.push(line);
        const verb = line.split(/[ :]/)[0].toUpperCase();
        if (replies[verb] != null) {
          socket.write(`${replies[verb]}\r\n`);
          continue;
        }
        if (verb === 'DATA') {
          inData = true;
          socket.write('354 go ahead\r\n');
        } else if (verb === 'QUIT') {
          socket.write('221 bye\r\n');
          socket.end();
        } else {
          socket.write('250 ok\r\n');
        }
      }
    });
  });
  const close = () => {
    for (const s of sockets) s.destroy();
    server.close();
  };
  return { server, received, close };
}

function listen(server) {
  return new Promise((res) => server.listen(0, '127.0.0.1', () => res(server.address().port)));
}

test('smtp delivers the message verbatim', async () => {
  const { server, received, close } = smtpStub();
  const port = await listen(server);
  const message = renderMail({
    to: 'ops@example.com',
    from: 'no-reply@example.com',
    signup: { email: 'jo@example.com', name: 'Jo', note: 'a repo' },
    at: '2026-08-26T12:00:00Z',
  });
  await sendMailSmtp(message, { port, from: 'no-reply@example.com', to: 'ops@example.com' });
  close();

  assert.ok(received.commands.some((c) => c.startsWith('MAIL FROM:<no-reply@example.com>')));
  assert.ok(received.commands.some((c) => c.startsWith('RCPT TO:<ops@example.com>')));
  assert.ok(received.body.includes('Subject: aimee cloud signup: jo@example.com'));
  assert.ok(received.body.includes('a repo'));
});

// A body line that is a single dot ends the DATA phase. Without stuffing, the
// message is truncated there and its tail is read as SMTP commands.
test('smtp escapes a leading dot so the message cannot be truncated', async () => {
  const { server, received, close } = smtpStub();
  const port = await listen(server);
  await sendMailSmtp('Subject: t\r\n\r\nbefore\r\n.\r\nafter\r\n', {
    port,
    from: 'a@b.com',
    to: 'c@d.com',
  });
  close();
  assert.ok(received.body.includes('before'), 'text before the dot line is missing');
  assert.ok(received.body.includes('after'), 'the message was truncated at the dot line');
});

test('smtp reports the server\'s own refusal', async () => {
  const { server, close } = smtpStub({ RCPT: '550 no such mailbox' });
  const port = await listen(server);
  await assert.rejects(
    () => sendMailSmtp('x\r\n', { port, from: 'a@b.com', to: 'nobody@example.com' }),
    /550 no such mailbox/,
  );
  close();
});

test('smtp fails rather than hanging when nothing is listening', async () => {
  await assert.rejects(
    () => sendMailSmtp('x\r\n', { port: 1, from: 'a@b.com', to: 'c@d.com', timeoutMs: 2000 }),
  );
});

test('smtp requires an envelope', async () => {
  await assert.rejects(() => sendMailSmtp('x', { port: 25 }), /from and to are required/);
});
