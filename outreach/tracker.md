# Outreach Tracker

| Date | Source | Person / Project | Context | Message Sent | Reply | Pain? | Wants Audit? | Next Step | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 2026-07-06 | GitHub issue search | levai-tech/research-companion#94 | Open issue: "Stripe webhook idempotency" | No | | Likely | Unknown | Read issue, consider a short non-promotional comment or maintainer DM | Recent, open, directly matches |
| 2026-07-06 | GitHub issue search | mahdibrr/awesome-nextjs-supabase#10 | Open issue: "Document Supabase + Stripe webhook idempotency edge cases at scale" | No | | Likely | Unknown | Good target for async discussion about edge cases | Recent, open, documentation angle |
| 2026-07-06 | GitHub issue search | cpa03/basefly#754 | Open issue: "[QA] Add integration tests for Stripe webhook idempotency" | No | | High | Unknown | Strong CI/testing signal | Mentions integration tests |
| 2026-07-06 | GitHub issue search | sstern42/socionics-match#926 | Closed bug: "Stripe webhook idempotency permanently drops events whose handler fails" | No | | High | Unknown | Read before outreach; failure mode may differ from duplicate processing | Recent closed bug |
| 2026-07-06 | GitHub issue search | MegaPhoenix92/trozlanomni#1143 | Closed issue: "[P2][billing] No Postgres integration test for Stripe webhook idempotency" | No | | High | Unknown | Strong testing gap signal | Recent closed issue |
| 2026-07-06 | GitHub issue search | Tristan578/project-forge#7819 | Closed issue: "checkout.session.completed optional DB save causes double-credit on retry" | No | | Very high | Unknown | Very close to PayHook demo; inspect before commenting | Exact duplicate-credit/retry pain |
| 2026-07-06 | GitHub issue search | regengine/RegEngine#1076 | Closed issue: "webhook handler has no event.id idempotency — retries cause duplicate tenants / funnel events" | No | | Very high | Unknown | Excellent proof point; do not spam if issue is closed | Exact idempotency bug |
| 2026-07-06 | GitHub issue search | percy-main/website-v2#179 | Closed bug: "Stripe webhook: idempotency check, level fixes, and per-handler tracing" | No | | High | Unknown | Good observability/testing angle | Mentions tracing and high severity |

## Target Criteria

Good targets:

- mentions Stripe Checkout, Stripe Billing, or webhooks
- building SaaS, subscription, e-commerce, entitlement, or payment flows
- has posted a question or issue about idempotency, duplicate events, retries, fulfillment, or subscriptions
- likely to respond directly as a founder or developer

Avoid:

- large company support accounts
- inactive accounts
- random users with no payment context
- threads where outreach would look like spam

## Search Queries

GitHub:

```text
"stripe webhook" "idempotency"
"checkout.session.completed" "duplicate"
"stripe webhook" "duplicate" "fulfillment"
"invoice.paid" "idempotency"
"stripe webhook" "ledger"
```

Reddit:

```text
site:reddit.com/r/SaaS stripe webhook idempotency
site:reddit.com/r/stripe duplicate webhook
site:reddit.com/r/webdev stripe webhook duplicate
site:reddit.com/r/node stripe webhook idempotency
```

Hacker News:

```text
site:news.ycombinator.com stripe webhook idempotency
site:news.ycombinator.com stripe billing webhook
```

Indie Hackers:

```text
site:indiehackers.com stripe webhook SaaS
site:indiehackers.com Stripe Billing subscription webhook
```
