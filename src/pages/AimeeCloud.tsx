import { useState } from 'react';
import {
  Badge,
  Button,
  CallToAction,
  CodeBlock,
  Field,
  FeatureCard,
  FeatureGrid,
  Hero,
  InlineStatus,
  Modal,
  Prose,
  Section,
} from '@rakuensoftware/smoothgui';
import type { InlineStatusMessage } from '@rakuensoftware/smoothgui';
import Meta from '../components/Meta';

/** Where a customer's aimee connects, shown in the quickstart. The page itself
 *  never calls it: signup is handled by this site's own server, same-origin. */
const API = 'https://api.aimee.rakuensoftware.com';

/** Signup posts here, on this host. It is a marketing-site concern and has
 *  nothing to do with a knowledge base — sending it to the API would put
 *  unauthenticated public traffic on the machine holding customer corpora, and
 *  would need CORS and a preflight to do what a relative path does with
 *  neither. */
const SIGNUP = '/api/signup';

const CONNECT = `# 1 — tell aimee its knowledge base is remote
aimee config set kb_mode remote
aimee config set kb_client_url ${API}

# 2 — paste the key from your welcome email
aimee config set kb_client_bearer_token aik_…

# 3 — index a repository and ask it something
cd ~/code/your-project
aimee workspace add .
aimee index scan .
aimee index investigate "why does the retry path drop the request id?"`;

export default function AimeeCloud() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<InlineStatusMessage | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  // Honeypot: hidden from people, filled by bots that complete every input.
  const [website, setWebsite] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().length < 3 || !email.includes('@')) {
      setStatus({ kind: 'err', msg: 'We need an email address to send your key to.' });
      return;
    }
    setSending(true);
    setStatus({ kind: 'info', msg: 'Sending…' });
    try {
      const res = await fetch(SIGNUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), note: note.trim(), website }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'That did not go through.');
      setEmail('');
      setName('');
      setNote('');
      setStatus({
        kind: 'ok',
        msg: body.message ?? "Thanks — we'll email you a setup code shortly.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'That did not go through.';
      setStatus({ kind: 'err', msg: `${msg} You can also email hello@rakuensoftware.com.` });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Meta
        title="aimee cloud — Rakuen Software"
        description="A hosted aimee knowledge base. We run the Postgres and the vectors; your agents keep running where they already are."
      />

      <Hero
        eyebrow="aimee cloud"
        title="Your agent forgets. The knowledge base doesn't."
        subtitle="A hosted aimee knowledge base: persistent typed memory, a cross-repo code graph, and hybrid retrieval over both. We run the Postgres and the vectors. Your agents keep running exactly where they are."
        actions={
          <>
            <Button variant="primary" onClick={() => setOpen(true)}>
              Start free
            </Button>
            <Badge label="Free tier, permanently" variant="info" />
          </>
        }
      />

      <Section eyebrow="The shape" title="We host the hard half. You keep the half that runs code.">
        <FeatureGrid columns={3}>
          <FeatureCard icon="🗄️" title="Your own database">
            One PostgreSQL database in its own container, not a shared table with a tenant column.
            aimee's corpus tables have no tenant column, so a knowledge base serves exactly one
            customer by construction.
          </FeatureCard>
          <FeatureCard icon="🔎" title="Retrieval in full">
            Lexical search, dense vector search over a bundled embedder, and the cross-repo code
            graph. Symbols, callers, blast radius.
          </FeatureCard>
          <FeatureCard icon="💻" title="Your code never moves">
            Delegates run on your machine, beside the worktree they already have, with your
            toolchain and your credentials. We host the database, not the execution.
          </FeatureCard>
          <FeatureCard icon="🔑" title="Keys you control">
            Read-only keys for CI, expiring keys for contractors, and revocation that takes effect
            on the next request — no restart, no propagation delay.
          </FeatureCard>
          <FeatureCard icon="🧳" title="Leaving is a config change">
            Same schema, same software. Export it and point your aimee at a local knowledge base.
            Nothing to migrate, nothing to re-index.
          </FeatureCard>
          <FeatureCard icon="🌱" title="Sleeps when you do">
            An idle knowledge base suspends and wakes on your next request, which is what keeps the
            free tier free.
          </FeatureCard>
        </FeatureGrid>
      </Section>

      <Section title="What stays yours" width="narrow" tone="muted">
        <Prose>
          <p>
            A knowledge base is a service behind an API: PostgreSQL with pgvector, an embedding
            model, and the storage that outlives any one session. It is also the part nobody wants
            to operate.
          </p>
          <p>
            Execution is the opposite. Your delegates want your checkout, your toolchain and your
            credentials. Moving them to someone else's hardware buys you nothing and costs you a
            trust boundary, so we don't.
          </p>
          <ul>
            <li>Your source, your working tree and your git credentials stay with you.</li>
            <li>Delegates and the code they write run on your hardware, sandboxed as they already are.</li>
            <li>Your model provider keys stay yours; your agent's model calls never touch us.</li>
            <li>We run PostgreSQL and pgvector, backed up nightly with a verified restore.</li>
          </ul>
        </Prose>
      </Section>

      <Section eyebrow="Pricing" title="There is a free tier, and it is staying." width="narrow">
        <Prose>
          <p>
            Not a trial and not an introductory rate. A free tier is part of what this is, and what
            you can do on it today you will still be able to do on it later.
          </p>
          <ul>
            <li>As many projects as you want to index.</li>
            <li>Your own dedicated database, not a shared one.</li>
            <li>The full retrieval stack: lexical, dense and the code graph.</li>
            <li>Suspends when idle and wakes on your next request.</li>
          </ul>
          <p>
            Paid plans will arrive for the things that genuinely cost us money — the curator's
            language-model passes, instances that stay warm, and corpora past a few gigabytes.
            They add to the free tier rather than carving pieces out of it.
          </p>
          <p>
            We are onboarding by hand while the service is young, so a setup code arrives by email
            rather than through a card form. That part is temporary. The free tier is not.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Getting started" title="Point your existing aimee at it." width="narrow" tone="muted">
        <Prose>
          <p>
            If you already run aimee this is a config change: the same client, the same commands, a
            knowledge base that happens to be elsewhere. If you don't, install the thin client
            first — a single binary with no database.
          </p>
        </Prose>
        <CodeBlock code={CONNECT} label="attach an existing aimee" />
      </Section>

      <CallToAction
        title="Start free"
        description="Tell us where to send your key and we will set you up."
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            Request a key
          </Button>
        }
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Start free"
        size="md"
        footer={
          <>
            <Button variant="primary" onClick={submit} disabled={sending}>
              {sending ? 'Sending…' : 'Request a key'}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <form onSubmit={submit}>
          <Prose>
            <p>
              We are onboarding by hand while the service is young, so tell us where to send your
              key and we will set you up.
            </p>
          </Prose>

          <Field label="Email" required>
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>

          <Field label="Name" hint="(optional)">
            <input
              type="text"
              autoComplete="name"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="What are you working on?" hint="(optional)">
            <textarea
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Language, roughly how big the codebase is, what you want it to remember."
            />
          </Field>

          {/* Off-screen rather than display:none, which some bots skip. */}
          <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
            <label htmlFor="su-website">Leave this empty</label>
            <input
              id="su-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <InlineStatus status={status} />

          <Prose>
            <p>
              <small>
                We use your address to send your key and to answer you. Nothing else, and no list.
              </small>
            </p>
          </Prose>
        </form>
      </Modal>
    </>
  );
}
