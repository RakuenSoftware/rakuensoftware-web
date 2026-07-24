---
title: "Token compression tools measure the wrong thing"
date: 2026-07-24
author: Rakuen Software
tags: [agents, llm, cost, aimee]
excerpt: "RTK and Headroom count tokens removed. Your provider bills cache writes, cache reads and replayed context. The real drain isn't the tool output. It's resending it four hundred times, and the fix is architectural, not a plugin."
---

I spent two days working out why an Anthropic reseller was billing me more than its own rate card implied. The answer turned into a rule I now apply to every "compress your context" tool: **tokens removed and money saved are different numbers, and a tool that only measures the first is not measuring your bill.**

I ran the same investigation against GPT-5.6 and the OpenAI API, using two tools that take opposite approaches: `RTK`, which rewrites command output, and `Headroom`, which proxies the model request. Then I read someone else's trace-level breakdown of where the tokens in a real coding session actually go, and it changed which layer I think the problem lives at. Fair warning: this is a wall of text, and it gets geeky.

## The number that actually gets billed

Providers do not charge you for tokens in the abstract. They charge for cache writes, cache reads, uncached input, output and reasoning, and each of those has a different price.

On GPT-5.6 the spread is wide. A cache read costs 10% of ordinary input. A cache write costs 125% of it. So a token that moves from "cached read" to "cache write" costs **12.5 times more**, not less.

That changes the maths on any tool that edits your prompt. Caching keys on an exact prefix match: same tokens, same order, byte for byte. Change one token in a cached prefix and everything after it stops matching. The whole suffix has to be written again at 125%.

Work the break-even and it is brutal. For an edit to an already-cached prefix to pay for itself on the *next* request, it has to remove more than **92% of the entire invalidated suffix**. Not 92% of the block it touched. 92% of everything downstream of the first changed token. Almost no real edit clears that bar.

I dug into Anthropic first, and it is where the rule came from. Anthropic runs its own cache, and it is widely misunderstood. The mechanism is unforgiving in one specific way: if a message is not byte-identical to what was there on the previous request, it is not a cache hit. You pay full, uncached input for it, with no partial credit for "nearly the same."

That is exactly what a "compress your context" tool does to you, in two ways. First, if the tool ever has to go back and pull the full original it compressed, which some call rehydrating, you have already spent more on that session than the compression could have saved. Second, the moment the tool changes anything about how that particular provider expects the prefix to look, you drop off the cached tokens and onto the full-price ones. In every case I measured, losing the cache cost far more than any tokens the tool removed. The saving is a rounding error next to the penalty.

It gets worse in practice because every Anthropic reseller implements caching slightly differently, which is how I ended up over-billed in the first place. Reducing tokens in a way that survives all of them, without tripping any one provider's cache rules, turned out to be a genuinely hard, provider-specific problem, not the one-line win the plugins sell. GPT-5.6 only sharpens the same edge: the numbers above are the OpenAI version of a penalty I first watched play out on Anthropic.

## RTK measures text, not money

`RTK` rewrites command output before it lands in history. It trims a verbose test run, collapses a big file listing. Its `rtk gain` counter reports how many tokens it saved.

It cannot report that number, because it cannot see the number. RTK sees command output and nothing else. It does not see the API request, the cache breakpoints, the cache state, the cache-write tokens or the cache-read tokens. `rtk gain` compares raw output against filtered output at roughly `characters / 4`. It is counting characters it deleted, not credits the provider did not charge.

That gap matters because coding agents already truncate large output before it reaches the model. RTK will happily claim it stripped hundreds of thousands of tokens from a file the agent would only ever have shown a few thousand of. In my own install it reported about 6.1 million tokens saved against work where the real input was a fraction of that.

The independent benchmarks land where you would expect. The one public GPT-5.6 comparison I could find (Tura's lab) put RTK at +7.18% cost, except its own two-run arm varied by 30.78%, so that figure proves nothing on its own. The JetBrains benchmark is firmer: it debunked the headline 60% to 90% savings claim outright, and found RTK ran 14.3% more cache reads on 13.8% more turns. The tech news site TechTimes reported it on 21 July, under the headline [RTK raises Claude Code costs at low effort, JetBrains benchmark debunks 60-90% claim](https://www.techtimes.com/articles/321223/20260721/rtk-raises-claude-code-costs-low-effort-jetbrains-benchmark-debunks-6090-claim.htm).

I want to be precise about that JetBrains result, because "RTK randomly nukes your cache" is the wrong lesson and I keep seeing people draw it. RTK formats *new* output before it enters history; it does not normally rewrite a prefix that is already cached. Once its compressed result is in history, later requests reuse it fine. The extra cache reads are mostly the extra turns re-reading context, plus limited command coverage and provider-side truncation doing the real work anyway. More turns, not a busted cache.

There is a sharper failure than cost, though. I reproduced a correctness bug in RTK 0.43.0: my pytest config already passed `-q`, RTK added its own `-q`, the effective `-qq` suppressed the summary RTK then went looking for, and it failed. That is not a bigger bill. It is a rewrite changing the result, which buys you a re-run and another turn, which *is* a bigger bill by the back door.

## Headroom is more capable and harder to trust

`Headroom` proxies the actual model request, so in principle it has the information RTK lacks. It can compress large, brand-new tool output before that output ever enters the cache, and with GPT-5.6 charging 125% on writes, shrinking something before it is written is exactly where real money lives.

The catch is what it still cannot see. Headroom sees explicit breakpoints if the client sends them, but it cannot see OpenAI's internal cache: which implicit breakpoint matched, or what OpenAI actually kept.

Two things in the current code make me distrust its dashboard as a GPT-5.6 ledger:

- It does not appear to support GPT-5.6's new explicit-breakpoint fields. It injects a `prompt_cache_key` and guesses which messages are still live. A stable cache key helps routing; it does not make two different prefixes match.
- Its cost model is stale. The code assumes cached reads cost 50% and writes carry no premium, and infers writes as uncached input because it says OpenAI exposes no write counter. On GPT-5.6 that is all wrong: reads are 10%, writes are 125%, and writes are reported in `cache_write_tokens`.

Then there is rehydration. If Headroom compresses something and the model later asks for the full original, you have now paid for the compressed version, the retrieval tool call, another model turn, and the original content in full. Unless that compressed version had already been reused enough times to bank a saving, the retrieval erases it.

To its credit, the current code restores frozen messages byte-for-byte, so I will not claim Headroom definitely busts the cache. That is a measurement problem, not a proven regression. But a dashboard doing counterfactual accounting with last year's price assumptions is not evidence it saved you anything.

## The bill isn't the tool output. It's replaying it.

Here is where I changed my mind about the whole category. Both tools fight over how big a single tool result is. That is not where a coding session's tokens go.

The clearest evidence I have seen is not my own. It is a trace-level writeup on r/codex, [Important findings on cache and baked-in Codex behaviour](https://www.reddit.com/r/codex/comments/1v4vawj/important_findings_on_cache_and_baked_in_codex/), and the numbers below are theirs, not mine. The author pulled the traces from ten `gpt-5.6-sol` Codex rollouts. Those ten sessions came to **252.2 million tokens: 251.7 million input, 581 thousand output.** Input was 99.77% of all traffic. Across 2,007 model calls, the average call took in **125,394 input tokens and produced 290 output tokens.** Some of those sessions made three edits total.

That is the shape of the problem. The model is not spending your tokens thinking or writing. It is re-sending its accumulated context (system prompt, tool schemas, repository instructions, file contents, shell output, patches, test logs, prior messages) hundreds of times. The average task made about 200 model calls and its peak input averaged 233,012 tokens, over 90% of the context window, before compaction kicked in. The worst single task in the set burned **61 million tokens across 434 calls in 98 minutes**, reinspecting and revalidating against a history that only grew.

The waste starts before you do. In those traces the first request alone averaged about **30,550 input tokens**, before the model had read a single source file or run one test. Most of that baseline is the runtime's own furniture: system and safety instructions, tool schemas, skill descriptions, plugin and repository rules, environment metadata. Much of it is supplied by the tool, not by you. Then it compounds. That worst task ran 132 file reads, 98 shell commands, 93 source searches and 78 patch operations, and every one of them stayed in the history the next call resent. Across the ten sessions the model was fed **8.21 million characters of tool output**; the author estimates an 8,000-character cap on each result would have stripped 2.93 million of them, 35.7%, before you even count the saving from not replaying that text on every later call.

Now put that next to the caching argument. That worst task had a **98.89% cache rate** and still recorded 60.9 million input tokens. Across all ten, the weighted cache rate was 97.8%: 246 million cached tokens against 5.5 million uncached. A high cache rate is exactly what makes people wave this away: "it's cached, it's basically free." On GPT-5.6 a cached read is 10% of input, not 0%. Ten per cent of 246 million is not free, and it is the same replayed context going around again, not new work.

The writeup is careful on one point, and so am I: the traces do not reveal how a given plan meters cached tokens against a subscription, so neither of us is claiming a specific billing bug. But metering is the small question. The runtime generates enormous context traffic, keeps consumed material live far too long, and gives you no way to see or stop it, and that is true whatever the discount on the replayed half.

Two more things came out of the same analysis. Subagents make the accounting worse, not better: one 18-minute child agent consumed 16.4 million tokens on its own. The parent had spawned four of them and only one child's trace was available, so the real total is higher than any number here, and if your UI shows only the root task you never see any of it. And the runtime ships with the savings switched off. The author inspected the source and found a `turn_cost_guard` that selects earlier, cheaper output summarisation, with every call site passing it `false`. A token-saving option, hard-coded off, that no prompt you write can turn on.

What turns this from waste into a grievance is that you cannot switch any of it off. You cannot shrink the base prompt, stop a skill being re-read twenty times, drop the tool schemas the task will never call, retire history the runtime is still carrying, force it to compact at a sensible point, or cap it at fifty calls instead of four hundred. Compaction only fires at the cliff, north of 90% of the window, rather than at the natural boundary between investigating and implementing where the old context stops being useful. The author of that writeup keeps a local fork of the runtime and patched some of this back by hand. Almost nobody can do that, and nobody should have to fork their coding tool to stop it draining them.

## What actually lowers the bill

Line the failures up and they point one direction. Compressing a tool result after the fact is the wrong layer. The bill is set by things a plugin cannot touch:

- **Retire consumed context.** Once a file read or a passing test log has done its job, the model does not need its full text on the next 300 calls. Keep the raw log on disk; leave a compact receipt in the prompt: status, the paths that mattered, what changed.
- **Don't reinject what hasn't changed.** An unchanged `AGENTS.md`, an unchanged skill file, the same source file read twice: represent it by a stored fact or a content hash, not a fresh copy pasted back into context on every call.
- **Load only the schemas the task needs.** A config change should not open with every email, calendar, browser and connector tool definition in the prompt. Defer the ones this task will never call.
- **Budget the output, not just the input.** A command that succeeded does not need the same 10,000-token allowance as one that failed with a stack trace. Ordinary success belongs closer to 1,500 to 2,500 tokens.
- **Compact at boundaries, not at the cliff.** Summarise when you cross from investigating to implementing, while you still know what mattered, instead of waiting for the context to hit 90% and dumping whatever is oldest.
- **Send the small model the small job.** A 125K-token context producing 290 output tokens should not be going to the top model at all. Most sub-tasks (a scoped edit, a lookup, a summary) belong on a cheaper model.
- **Cap the runtime, and show the bill.** Model calls, cumulative input, child agents, tool-output bytes, context percentage, repair cycles: budgets you can see and enforce, with root and child usage on the same screen, not a `turn_cost_guard` someone else nailed shut.

None of that is compression. It is holding less context, for less time, and refusing to replay it.

## This is what we build aimee to do

I did not arrive at that list from the blog post backwards. It is the design brief for `aimee`, our local server that sits between a coding tool and the model. The controls Codex withholds are the ones aimee is built to hand back, so that getting them does not require a fork of the runtime that almost nobody can maintain.

Its memory is the "stored fact instead of a fresh re-read" point made concrete: facts about the repository and prior decisions are written once and recalled when relevant, so a session does not rebuild the same understanding, and re-pay the 30,550-token entry fee for it, every time it starts. Its map of the code lets the agent navigate by structure instead of dumping files into the prompt to find one function. Its delegate models take the bounded sub-tasks off the expensive model, so a 290-token edit does not ride on the top tier. And the economizer is the accounting and the budgets the traces above show Codex withholding: where the tokens went, root and child on one screen, with caps you set on calls, input, child agents, tool-output bytes and context percentage rather than limits set for you and switches nailed shut. The guardrails it cannot write past are there for the same reason: the runtime should answer to you, not the other way round.

I am not going to hand you a savings percentage for aimee, because that would be the exact `rtk gain` move this whole post is against. The only honest number is cost per successful task, measured in paired runs: tool on, tool off, same model, same effort, same repositories reset to the same state, same success check, several repetitions. That is the bar aimee has to clear too, and it is the bar we hold it to.

## Bottom line

Delete the compression plugins. On the evidence, `RTK` shows no saving and sometimes a higher bill, plus a correctness bug I hit myself; `Headroom` could in theory help on GPT-5.6 but its current build will not tell you whether it did. Both are fighting over the size of one tool result while the real bill is the same context replayed across hundreds of calls.

The lever that reliably lowers your bill is not compressing the context you send. It is holding less of it, keeping what you do send byte-stable so the cache keeps working, retiring it once it has been used, and putting the cheap jobs on cheap models. That is an architecture problem, not a plugin, which is why we build `aimee` around it, and why I would still tell you to measure it before you believe it.
