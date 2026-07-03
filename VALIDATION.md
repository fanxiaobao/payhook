# PayHook Validation Plan

## Goal

Validate whether developers recognize payment webhook idempotency as a painful enough problem to try a tool.

Do not optimize for stars, upvotes, or launch polish yet.

## Current Ask

Ask target users:

1. Have duplicate or retried webhooks ever caused bugs in your app?
2. How do you currently test webhook idempotency?
3. Would you run a local CLI before shipping a payment integration?
4. Is Stripe-only enough for a first version?
5. Would this be more useful as CLI, GitHub Action, or hosted dashboard?

## Target Communities

- Reddit: `r/SaaS`
- Reddit: `r/stripe`
- Reddit: `r/webdev`
- Reddit: `r/java`
- Reddit: `r/ExperiencedDevs`
- Hacker News: `Show HN`
- Indie Hackers
- direct messages to backend/SaaS/payment developers

## Reddit / Indie Hackers Draft

Title options:

```text
How do you test Stripe webhook idempotency?
```

```text
I built a tiny CLI to catch duplicate Stripe webhook bugs
```

Post:

```text
I am testing an idea for developers who integrate Stripe webhooks.

I built a small local CLI that sends duplicate Stripe-style payment events to your webhook endpoint, then checks whether your order/payment state is still correct.

The demo catches a common bug:
- checkout.session.completed arrives
- the same event arrives again
- the app returns 200 OK both times
- but internally it creates duplicate fulfillment or ledger entries

Question for people who have integrated Stripe, PayPal, Paddle, Lemon Squeezy, etc:

How do you currently test webhook idempotency and retries?
Have duplicate or retried webhooks ever caused real bugs for you?

I am not trying to sell anything yet. I am trying to understand whether this pain is real enough to keep building.
```

## Hacker News Draft

```text
Show HN: PayHook - a local CLI for testing Stripe webhook idempotency

I built a small prototype for a problem I have seen in payment integrations: webhook handlers often return 200 OK but still mutate internal state incorrectly when duplicate or retried events arrive.

The first scenario sends a Stripe-style checkout.session.completed event twice, then checks local debug endpoints to verify that the app only marked the order paid once and only created one ledger entry.

The demo intentionally fails first, then passes after switching the sample handler to dedupe by Stripe event id.

I am validating the problem more than the implementation right now.

Questions:
- How do you test webhook idempotency today?
- Would you want this as a local CLI, CI check, or hosted test runner?
- Which provider/scenario should be next after Stripe duplicate events?
```

## Direct Message Draft

```text
Hey, quick question since you have worked on SaaS/backend/payment flows.

I am validating a tiny dev tool idea: a local CLI that stress-tests payment webhook handlers with duplicate/retried/out-of-order events and checks whether the app's order/payment state stays correct.

The first demo catches duplicate Stripe checkout.session.completed causing duplicate fulfillment or ledger entries.

Have you ever seen this class of bug? How do you normally test webhook idempotency?
```

## Feedback Log Template

| Date | Person / Channel | Uses payments? | Has felt pain? | Current workaround | Wants to try? | Notes |
|---|---|---:|---:|---|---:|---|
| | | | | | | |

## Continue Criteria

Continue building if:

- 5+ developers say they have encountered the problem
- 3+ developers agree to try the CLI
- 1+ developer asks for CI/GitHub Action support
- someone mentions a real incident involving duplicate fulfillment, entitlement, refund, dispute, or ledger mismatch

## Pivot / Stop Criteria

Pause or pivot if:

- people understand the product but do not care
- everyone says existing provider tools already solve it
- nobody wants to try even a free local CLI
- the only interested users are large enterprises with slow sales cycles
