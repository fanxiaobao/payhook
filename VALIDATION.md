# PayHook Validation Plan

This document is a demand-validation playbook, not a product roadmap.

The current goal is to answer one question:

> Is payment webhook idempotency painful enough that developers would try a dedicated local tool?

## One-Line Positioning

PayHook is a local CLI that simulates duplicate, retried, delayed, and eventually out-of-order payment webhook scenarios, then checks whether your order, fulfillment, entitlement, and ledger state still end correctly.

## Current Hypothesis

Core hypothesis:

> Developers who integrate payment webhooks worry about duplicate, retried, or out-of-order events corrupting internal state. If a local CLI can catch those bugs before production, some of them will try it.

Sub-hypotheses:

1. Developers know payment webhooks can be duplicated or retried.
2. Developers have experienced or worry about duplicate fulfillment, duplicate entitlement, or duplicate ledger entries.
3. Existing tools mostly help send events; they do not fully answer whether business state ends correctly.
4. A local CLI is an acceptable first form factor.
5. A Stripe-only MVP is narrow but still useful enough for early feedback.

## What Not To Validate Yet

Do not optimize for:

- pricing
- SaaS accounts
- hosted dashboards
- multi-provider coverage
- polished UI
- enterprise procurement

Those are premature. Validate pain and willingness to try first.

## Target Users

Prioritize:

- SaaS founders and engineers
- developers who have integrated Stripe Billing or Checkout
- backend engineers working on subscriptions, paywalls, entitlements, or fulfillment
- e-commerce developers handling order fulfillment
- engineers working on payments, ledgers, refunds, or disputes
- agencies or freelancers who build payment integrations for clients

Do not prioritize:

- people with no payment integration experience
- frontend-only developers who never touch backend state
- enterprise procurement or compliance stakeholders
- people who cannot evaluate developer tooling directly

## Core Questions

Ask users:

1. Which payment providers have you integrated?
2. Have you seen duplicate, retried, delayed, or out-of-order webhook events?
3. Did those events ever cause duplicate fulfillment, duplicate entitlement, duplicate ledger entries, or incorrect order state?
4. How do you test webhook idempotency today?
5. Would you run a local CLI or CI job before shipping a payment integration?
6. Which form factor feels most useful: CLI, GitHub Action, test framework plugin, or hosted dashboard?
7. Is a Stripe-only first version useful enough?
8. Which scenario should come next: refund, dispute, subscription renewal failure, out-of-order delivery, or slow-handler retry?

## Continue Criteria

Keep building if:

- 5+ developers say they have encountered this class of problem
- 3+ developers agree to clone and try the CLI
- 1+ developer asks for CI or GitHub Action support
- someone shares a real incident involving duplicate fulfillment, entitlement, refunds, disputes, or ledger mismatch
- someone asks for a specific next scenario instead of giving generic encouragement

Weak signals:

- stars only
- "cool project" with no concrete pain
- implementation discussion without workflow discussion
- people say it sounds useful but nobody wants to try it

Stop or pivot if:

- most people understand the problem but do not care
- most people say Stripe CLI or provider dashboards are enough
- nobody wants to run even a free local demo
- only large enterprises are interested, and all require long sales cycles

## Channels

Do not blast every platform. Start with one or two.

Priority:

1. Reddit `r/SaaS`
2. Reddit `r/stripe`
3. Reddit `r/webdev`
4. Hacker News `Show HN`
5. Indie Hackers
6. Direct messages to backend, SaaS, or payment developers

Avoid Product Hunt at this stage. Product Hunt is closer to a launch, while this phase needs pain discovery.

## Reddit / Indie Hackers Draft

Title options:

```text
How do you test Stripe webhook idempotency?
```

```text
I built a tiny CLI to catch duplicate Stripe webhook bugs
```

```text
Have duplicate payment webhooks ever caused bugs in your app?
```

Post:

```text
I am validating a small dev tool idea for people who integrate payment webhooks.

The problem:
Payment providers can send duplicate or retried webhook events. Your endpoint can return 200 OK, but your app may still mutate internal state twice, such as duplicate fulfillment, duplicate entitlement, or duplicate ledger entries.

I built a tiny local CLI prototype called PayHook.

The first scenario sends a Stripe-style checkout.session.completed event twice, then calls local assertion endpoints to check whether the order was paid once and whether only one ledger entry was created.

Repo:
https://github.com/fanxiaobao/payhook

Silent 60-second demo:
https://github.com/fanxiaobao/payhook/releases/tag/demo-video-v1

I am not trying to sell anything yet. I am trying to understand whether this is a real enough pain to keep building.

Questions:
- How do you currently test Stripe webhook idempotency?
- Have duplicate or retried webhooks ever caused real bugs for you?
- Would you use this as a local CLI, a GitHub Action, or a hosted dashboard?
```

## Hacker News Draft

```text
Show HN: PayHook - a local CLI for testing payment webhook idempotency

I built a small prototype for testing a failure mode I have seen in payment integrations: a webhook handler returns 200 OK, but still mutates internal state incorrectly when duplicate or retried payment events arrive.

The first scenario sends a Stripe-style checkout.session.completed event twice. Then it calls local assertion endpoints to verify that the app only marked the order paid once and only created one ledger entry.

The demo intentionally fails first, then passes after switching the sample handler to dedupe by Stripe event id.

Repo:
https://github.com/fanxiaobao/payhook

Silent 60-second demo:
https://github.com/fanxiaobao/payhook/releases/tag/demo-video-v1

This is a demand-validation prototype, not a polished product.

Questions:
- How do you test webhook idempotency today?
- Would this be more useful as a local CLI, GitHub Action, or hosted test runner?
- Which payment scenario should be next: refund, dispute, subscription renewal, or out-of-order delivery?
```

## Direct Message Draft

```text
Quick question since you have worked on backend/payment flows.

I am validating a tiny dev tool idea: a local CLI that stress-tests payment webhook handlers with duplicate/retried/out-of-order events, then checks whether the app's order/payment state stays correct.

The first demo catches duplicate Stripe checkout.session.completed causing duplicate fulfillment or ledger entries.

Have you ever seen this class of bug? How do you normally test webhook idempotency?

Repo:
https://github.com/fanxiaobao/payhook
```

## Feedback Log Template

| Date | Person / Channel | Payment experience | Has felt pain? | Current workaround | Wants to try? | Next scenario requested | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

When recording feedback, capture:

- which payment provider they use
- whether they handle one-time payments, subscriptions, e-commerce orders, wallets, or ledgers
- whether a real incident happened
- how they currently test webhook behavior
- whether they are willing to clone the repo
- which scenario they want next

## First Validation Sprint

Day 1:

- Share the 60-second demo with 5 developers you know.
- Do not over-explain. See whether they understand the problem quickly.

Day 2:

- Post once on Reddit.
- Reply carefully to comments.
- Ask for concrete incidents and workflows.

Day 3:

- Add an FAQ if feedback reveals confusion.
- Help anyone who volunteers to try the CLI.

Day 4-5:

- Decide the next move:
  - If people ask for CI, build a GitHub Action.
  - If people ask for refunds or disputes, add the next scenario.
  - If nobody cares, pause instead of adding features.

## Replying To Comments

Good replies:

- ask about real incidents
- ask how they currently test this
- acknowledge the MVP is rough
- ask if they would try it locally

Avoid:

- hard selling
- arguing that Stripe CLI is insufficient
- discussing pricing too early
- dropping multiple links repeatedly

## Main Question

The only question that matters right now:

> Is this class of bug painful enough that developers would run one more tool locally or in CI?

If yes, productize. If no, stop or pivot.
