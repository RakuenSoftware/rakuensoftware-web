---
title: "Stacking isn't composing"
date: 2026-07-24
author: Rakuen Software
tags: [agents, llm, architecture, aimee]
excerpt: "Every AI stack is sold as modular: snap in a token compressor, a cache planner, a memory layer. Turn them on together and they fight over the same bytes. The trouble is in the handoffs, the one place no addon owns. aimee routes every interaction across one recorded bus instead."
---

Every AI stack is sold as modular. Snap in a token compressor, a cache planner, a memory layer, and each one promises the same thing: install it and things get better.

So you do. `Headroom` claws back context-window space. `RTK` gets more out of the provider's cache. Both work when they're the only one running. Turn them on together and the bill goes up, the context gets worse, and recall starts missing things it used to find. You lose an afternoon trying to figure out which addon regressed, and the answer is that none of them did.

The reason is that they were never really separate. `Headroom`'s whole job is to remove context. `RTK`'s whole job is to keep the prefix stable so the cache keeps paying off. They want opposite things from the same bytes and neither one can see the other. `Headroom` rewrites the prefix `RTK` was relying on, and a read that should have been discounted gets billed as a fresh write. `RTK` holds onto context `Headroom` is trying to shed. Whoever runs last gets their way, which means the result depends on the order the plugins happened to load.

The memory layer makes it a three-way problem. Memory's job is to put the right fact in front of the model at the moment it's needed, and it's sitting on top of one addon that deletes context and another that won't let it move. It recalls a fact, `Headroom` folds the fact back out to save space, and next turn memory recalls it again. There's a quieter version of the same problem underneath. Memory decides what's worth storing based on what it can see, but what it sees has already been summarized by `Headroom` and shuffled by `RTK`, so it ends up indexing a garbled version of the session and recalling the wrong things later. That drift builds up over weeks.

None of the addons has a bug. Each one is doing exactly what it was built to do. The trouble is in the handoffs between them, which is the one place no addon is looking and no addon owns. They all report success to their own dashboards while the thing as a whole gets slower, dumber, and more expensive.

## Stacking isn't composing

Pure functions compose because they keep their hands off shared state. Addons don't have that luxury. Each of them works by editing the same thing, the context window and the request built from it. It's one shared resource, and each addon's edit lands on top of everyone else's. It's stateful, so the order of the edits changes the result. And the numbers that actually decide cost and quality, the provider's cache state and real billing, live behind an API that only tells you what happened after you've already paid for it.

So every addon ends up chasing a number it can measure instead of the one that matters. `Headroom` watches token count, `RTK` watches cache hits, memory watches similarity scores. Each number can look great on its own while the answers get worse and the bill climbs. (The provider-pricing half of this, why shaving tokens off a prompt can raise your bill instead of lowering it, is its own post: [token compression tools measure the wrong thing](/blog/token-compression-tools-cost-more-than-they-save).)

This isn't a `Headroom` problem or an `RTK` problem. Both are sensible. It's the arrangement that's broken: several things editing one shared resource with no agreement on order, no shared goal, and no record of who changed what. Swap in better addons and the next pair collides in the same place.

## Doing both

`aimee` does this same work. It compresses, it manages headroom, it plans around the cache. What it doesn't do is produce these fights, and that comes down to two things it handles at once.

The first is that it prices its edits against what they actually cost. It knows the difference between an uncached token, a cache read at a discount, and a write at full price, and it knows that shaving a few tokens off the front of the prompt can flip a cheap read into an expensive write. So it only makes the edit when the real bill goes down. The `Headroom`/`RTK` fight never starts, because the thing trimming the context is the same thing that understands the cache, and it won't make a cut that throws the read away.

The second is that its memory isn't stacked on top of the economizer. They're peers. This is the part the opening story quietly gave away by calling the third box a semantic-memory layer, because a bolted-on box really is just that. All it can do from up there is embed whatever text it's handed and look it up later.

`aimee`'s memory does more than look things up. It pulls structured facts out of a session, decides what's worth keeping, tracks where each fact came from and how much to trust it, drops old facts when newer ones replace them, and links facts to your actual code. You can't get any of that from a box bolted onto the context window, because every one of those jobs depends on another part of the system. Extraction needs the extractors. Knowing where a fact came from needs the vault and the source connectors. Grounding needs the code map. Deciding what to trust and what to retire needs the guardrails and the audit trail. Cut memory off from those neighbors and it collapses back into a plain semantic-memory layer. The extra depth was never in the memory box itself; it was in memory being able to reach the rest of the system.

## The seam

If every module called every other module directly, you'd have the usual tangle, where nothing can change without breaking something two rooms over. `aimee`'s modules don't call each other at all. They speak to one event bus. A module puts typed events onto it and reads the ones it cares about, and that's the whole story of how any two parts of `aimee` interact.

The words "event bus" usually bring to mind a broker off in its own process, waiting over a socket, a network hop in each direction, and messages quietly dropped when things back up. `aimee`'s bus isn't that. It runs in-process. A module hands a typed event to a single host inside the same address space, so putting an event on the bus is about as expensive as a function call, not a network trip. That's what lets it carry real-time work, an economizer pricing an edit or a guardrail rating a request mid-turn, instead of just logging. Events come through one host and one consumer in a fixed order, and when the consumer gets behind the bus blocks and drops nothing. Everything that goes across gets written down as it passes.

A few things fall out of that. A new module wires into the bus once and immediately has memory, the economizer, the guardrails, and audit within reach, without learning any of their internals. Adding the tenth module is as easy as adding the second. And because a module can reach the whole system through the bus, it doesn't have to be linked against the whole system: the vault, for instance, needs audit to see what it does, but it's compiled into a lot of binaries and audit isn't, so instead of calling audit directly it emits a hook that does nothing by default, and one small bridge wires that hook to the bus in the one place that makes sense.

The bus is also just a contract about events, not a library you compile in, so it isn't tied to `aimee`'s language. There are reference implementations in a few languages, and anything that speaks the protocol, whether a Python script or a Rust sidecar, is a full participant at runtime. Something out of process pays the cost of talking across a boundary, but it still gets the same ordering and the same recording as everything native.

## Reproducibility

Because every interaction goes across the bus and the bus writes down what crosses it, the recording is the entire run and not a sample of it. This is exactly what a plugin stack can't manage. In a stack the addons talk through back channels no one is recording, so the log always has holes, and the moment that actually caused the problem is usually in one of them. Play the log back and you're really just playing back the parts you happened to capture.

`aimee`'s recording is complete because there's no back channel to miss. Feed the events back through and you get the same run again, in the same order, with the same decisions. That's what makes the rest possible. You can show precisely what happened and why: which guardrail stopped a request, which economizer changed a prompt, what the vault handed back. Refusals are written down the same as anything else, so a credential denied over the wrong transport shows up in the ledger. When something goes wrong you replay the exact session instead of reconstructing it from fragments. A recorded session becomes a regression test that doesn't flake, because the run is faithful and any change in behavior is a real one. And because all of this rides the bus rather than any one module's internals, a module written in any language is auditable on the same footing as the rest.

Normally extending a system costs you some control, because each new plugin is another place behavior can slip past whatever you're watching. Here the only way to join is through the recorded bus, so there's no such thing as opening a path nobody can see.

## Believing the record

There's still a fair objection: `aimee` writes this record about itself, and anything in full control of its own logs can produce a spotless account of things that never happened. Recording everything doesn't make the recording honest. Two things deal with that.

The ledger can't be edited after the fact. It's append-only and hash-chained, so every entry is tied to the ones before it, and altering an old event, dropping a denial, or slipping in a fake one breaks the chain at once.

And the record gets compared against numbers `aimee` doesn't control. If it says an edit saved money, the provider's own usage and billing say whether that's true. If `aimee` says an action ran, it shows up in external logs `aimee` has no control over. When the inside account and the outside account line up, that agreement means something precisely because `aimee` only wrote one side of it. When they don't line up, the mismatch is easy to spot and tells you where to look.

With the ledger sealed against edits and reconciled against the outside, you don't have to take `aimee`'s word for what happened; you can check it. A plugin stack has no way to offer that. It can't hand you a complete account that squares with an outside source, because there's no single account of what the stack did in the first place.

## Close

That lost afternoon chasing three addons that all turned out to be fine wasn't really a debugging problem. Each one did its job, the bill still went up, and when it was over there was no way to say what had actually happened, because nothing had recorded the parts where the addons touched. Any system that lets separate pieces edit one shared, hidden thing is one unlucky combination away from the same afternoon.

Everything here traces back to a single choice: every interaction goes across one recorded, ordered, tamper-evident bus, and nothing goes anywhere else. That one choice is why the economizers cooperate with memory, why a module in any language can join at runtime, why a session replays exactly, and why an outsider can check the record. The usual pitch treats modularity as independence, as parts that know nothing about each other and click together, and independence is exactly what sends those parts fighting in the dark with no one able to say what went wrong.

A plugin stack asks you to trust each addon and gives you no way to check. `aimee` asks you to trust one bus, and lets you check that too.
