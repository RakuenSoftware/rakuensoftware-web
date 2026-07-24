---
title: "Token compression tools measure the wrong thing"
date: 2026-07-24
author: Rakuen Software
tags: [agents, llm, cost]
excerpt: "RTK and Headroom count tokens removed. Your provider bills cache writes, cache reads and turns. Those are not the same number, and on GPT-5.6 the gap can run the wrong way."
---

I spent two days working out why an Anthropic reseller was billing me more than its own rate card implied. The answer turned into a rule I now apply to every "compress your context" tool: **tokens removed and money saved are different numbers, and a tool that only measures the first is not measuring your bill.**

This time I ran the same investigation against GPT-5.6 and the OpenAI API, using two tools that take opposite approaches: `RTK`, which rewrites command output, and `Headroom`, which proxies the model request. Fair warning — this is a wall of text, and it gets geeky.

## The number that actually gets billed

Providers do not charge you for tokens in the abstract. They charge for cache writes, cache reads, uncached input, output and reasoning, and each of those has a different price.

On GPT-5.6 the spread is wide. A cache read costs 10% of ordinary input. A cache write costs 125% of it. So a token that moves from "cached read" to "cache write" costs **12.5 times more**, not less.

That changes the maths on any tool that edits your prompt. Caching keys on an exact prefix match — same tokens, same order, byte for byte. Change one token in a cached prefix and everything after it stops matching. The whole suffix has to be written again at 125%.

Work the break-even and it is brutal. For an edit to an already-cached prefix to pay for itself on the *next* request, it has to remove more than **92% of the entire invalidated suffix** — not 92% of the block it touched, 92% of everything downstream of the first changed token. Almost no real edit clears that bar.

Anthropic's caching is stricter still: if the message is not byte-identical to what was there before, you are not on the cache and you are paying full freight. Every reseller implements it slightly differently, which is how I ended up over-billed in the first place.

## RTK measures text, not money

`RTK` rewrites command output before it lands in history — trims a verbose test run, collapses a big file listing. Its `rtk gain` counter reports how many tokens it saved.

It cannot report that number, because it cannot see the number. RTK sees command output and nothing else. It does not see the API request, the cache breakpoints, the cache state, the cache-write tokens or the cache-read tokens. `rtk gain` compares raw output against filtered output at roughly `characters / 4`. It is counting characters it deleted, not credits the provider did not charge.

That gap matters because coding agents already truncate large output before it reaches the model. RTK will happily claim it stripped hundreds of thousands of tokens from a file the agent would only ever have shown a few thousand of. In my own install it reported about 6.1 million tokens saved against work where the real input was a fraction of that.

The independent benchmarks land where you would expect. The one public GPT-5.6 comparison I could find (Tura's lab) put RTK at +7.18% cost — except its own two-run arm varied by 30.78%, so that figure proves nothing on its own. The JetBrains benchmark is firmer: it debunked the headline 60–90% savings claim outright, and found RTK ran 14.3% more cache reads on 13.8% more turns. Techtimes wrote it up on 21 July.

I want to be precise about that JetBrains result, because "RTK randomly nukes your cache" is the wrong lesson and I keep seeing people draw it. RTK formats *new* output before it enters history; it does not normally rewrite a prefix that is already cached. Once its compressed result is in history, later requests reuse it fine. The extra cache reads are mostly the extra turns re-reading context, plus limited command coverage and provider-side truncation doing the real work anyway. More turns, not a busted cache.

There is a sharper failure than cost, though. I reproduced a correctness bug in RTK 0.43.0: my pytest config already passed `-q`, RTK added its own `-q`, the effective `-qq` suppressed the summary RTK then went looking for, and it failed. That is not a bigger bill. It is a rewrite changing the result, which buys you a re-run and another turn — which *is* a bigger bill, by the back door.

## Headroom is more capable and harder to trust

`Headroom` proxies the actual model request, so in principle it has the information RTK lacks. It can compress large, brand-new tool output before that output ever enters the cache — and with GPT-5.6 charging 125% on writes, shrinking something before it is written is exactly where real money lives.

The catch is what it still cannot see. Headroom sees explicit breakpoints if the client sends them, but it cannot see OpenAI's internal cache — which implicit breakpoint matched, or what OpenAI actually kept.

Two things in the current code make me distrust its dashboard as a GPT-5.6 ledger:

- It does not appear to support GPT-5.6's new explicit-breakpoint fields. It injects a `prompt_cache_key` and guesses which messages are still live. A stable cache key helps routing; it does not make two different prefixes match.
- Its cost model is stale. The code assumes cached reads cost 50% and writes carry no premium, and infers writes as uncached input because it says OpenAI exposes no write counter. On GPT-5.6 that is all wrong: reads are 10%, writes are 125%, and writes are reported in `cache_write_tokens`.

Then there is rehydration. If Headroom compresses something and the model later asks for the full original, you have now paid for the compressed version, the retrieval tool call, another model turn, and the original content in full. Unless that compressed version had already been reused enough times to bank a saving, the retrieval erases it.

To its credit, the current code restores frozen messages byte-for-byte, so I will not claim Headroom definitely busts the cache. That is a measurement problem, not a proven regression. But a dashboard doing counterfactual accounting with 2024's price assumptions is not evidence it saved you anything.

## When compression can actually pay

It is not never. Compression can come out ahead when:

- It shrinks large, brand-new tool output *before* the model sees it.
- It only touches content after a known explicit breakpoint, so it never invalidates a cached prefix.
- It is deterministic — identical input produces identical output every time, so it does not silently break the cache on a re-run.
- It keeps a request under GPT-5.6's 272K long-context pricing threshold that it would otherwise cross.

Every one of those is a specific, measured situation. None of them is "install the plugin and stop thinking about it."

## The only benchmark worth running

The single number that matters is **cost per successful task**. Not tokens removed. Not a `gain` counter. Cost per task that actually completed.

To get it, run paired sessions: the tool on, the tool off, same model, same reasoning effort, same repositories reset to the same state, same success check. Measure cache writes, cache reads, uncached input, output, reasoning, retries, extra turns, retrievals, and whether the task passed. Several repetitions, not one, and never "yesterday versus today" while the agent itself is changing under you.

Until someone publishes that for GPT-5.6, "tokens saved" is a marketing counter. My working conclusion:

- **RTK**: strong external evidence of no saving and sometimes higher total cost, plus a correctness bug I hit myself. Neutral at best for typical coding sessions.
- **Headroom**: could in theory save money on GPT-5.6, but I do not trust the current implementation to, and its dashboard will not tell you either way.

My advice is the boring one. Delete the compression plugins. The lever that reliably lowers your bill is not compressing the context you send — it is sending less context in the first place, and keeping the context you do send byte-stable so the cache keeps working. Everything else, measure before you believe it.
