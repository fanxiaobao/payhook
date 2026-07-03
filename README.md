# PayHook

PayHook is a local-first CLI for testing payment webhook reliability.

It is not trying to replace Stripe CLI, Postman, or webhook.site. It focuses on a narrower question:

> If payment providers send duplicate, retried, delayed, or out-of-order webhook events, does your own order, fulfillment, entitlement, or ledger state still end up correct?

This repository is currently a demand-validation prototype. The goal is to validate whether payment webhook idempotency and state-machine correctness are painful enough for developers to try a dedicated tool.

## Why This Exists

A common mistake in payment webhook integrations is assuming:

> The endpoint returned `200 OK`, so the webhook was handled correctly.

But the real failure often happens inside your application state.

Example:

1. `checkout.session.completed` arrives once.
2. Your app marks the order as paid.
3. Your app grants entitlement or triggers fulfillment.
4. Your app creates a payment or ledger entry.
5. The same webhook event is retried or delivered again.
6. Your endpoint still returns `200 OK`.
7. Internally, the app grants entitlement again or creates another ledger entry.

This class of bug is easy to miss during manual local testing because most developers only test the happy path where each event arrives once and in the expected order.

PayHook turns messy-but-real payment delivery behavior into repeatable local tests.

## Current MVP

The current MVP implements one complete scenario:

- send a Stripe-style `checkout.session.completed` event
- send the same event again to simulate duplicate delivery
- send `payment_intent.succeeded`
- call local assertion endpoints
- report whether order, fulfillment, and ledger state are still correct

Implemented:

- `stripe/duplicate-payment-succeeded`
- Stripe-style signed webhook requests
- YAML assertion file
- Java demo service
- two demo modes:
  - `flawed`: intentionally non-idempotent, expected to fail
  - `dedupe`: dedupes by Stripe event id, expected to pass

Planned:

- out-of-order payment lifecycle
- slow handler retry
- refund after payment
- dispute / chargeback after payment
- GitHub Action / CI mode

## Who This Is For

PayHook is currently aimed at:

- SaaS developers integrating Stripe webhooks
- backend engineers building subscription, paywall, entitlement, or fulfillment flows
- teams handling payment, refund, dispute, settlement, or ledger state
- developers who want to test payment state-machine idempotency before production

It is not currently for:

- people looking for a full payment gateway
- teams looking for a low-code visual testing platform
- production webhook proxy use cases
- users who cannot expose local debug/assertion endpoints

## Requirements

- Node.js 20+
- Java 17+ for the demo service

The current MVP has no npm dependencies and no Maven dependencies.

## Quick Start

Enter the project directory:

```bash
cd payhook
```

Run tests:

```bash
npm test
```

List available scenarios:

```bash
node bin/payhook.js list
```

Example output:

```text
stripe/duplicate-payment-succeeded  ready
  Sends a checkout completion twice, then a payment success event.
stripe/out-of-order-payment-lifecycle  planned
  Replays a valid payment lifecycle in unexpected order.
```

## Run The Demo

### 1. Start the Java demo service

In the first terminal:

```bash
cd payhook
mkdir -p /tmp/payhook-demo-classes
javac -d /tmp/payhook-demo-classes examples/java-http-stripe-demo/PayhookDemo.java
java -cp /tmp/payhook-demo-classes PayhookDemo
```

You should see:

```text
PayHook Java demo listening on http://localhost:8080
Webhook endpoint: http://localhost:8080/webhooks/stripe
Mode: flawed. POST /test/mode/dedupe to enable event-id dedupe.
```

The demo starts in `flawed` mode. In this mode, the webhook handler intentionally does not dedupe by event id.

### 2. Run the PayHook scenario

In a second terminal:

```bash
cd payhook
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Expected output:

```text
Scenario: stripe/duplicate-payment-succeeded
Target:   http://localhost:8080/webhooks/stripe

Events:
  1. checkout.session.completed     200    63ms
  2. checkout.session.completed     200     2ms  duplicate
  3. payment_intent.succeeded       200     1ms

Checks:
  FAIL order is paid once
       expected paidCount=1, got paidCount=2
       expected fulfillmentCount=1, got fulfillmentCount=2
  FAIL ledger has one payment entry
       expected paymentEntries=1, got paymentEntries=2

Result: failed
```

Notice the key point: every webhook request returned `200`, but the internal state is still wrong.

### 3. Switch to the fixed idempotent mode

Run:

```bash
curl -X POST http://localhost:8080/test/mode/dedupe
```

Run the same PayHook command again:

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Expected output:

```text
Checks:
  PASS order is paid once
  PASS ledger has one payment entry

Result: passed
```

The same duplicate webhook scenario now passes because the demo handler dedupes by Stripe event id.

## Assertion Files

PayHook does not connect directly to your database and does not assume a specific language or framework.

For the MVP, it uses a simple assertion approach: after sending events, PayHook calls local HTTP endpoints that you provide.

Example:

```yaml
version: 1
checks:
  - name: order is paid once
    method: GET
    url: http://localhost:8080/test/orders/order_123
    expect:
      status: 200
      json:
        status: PAID
        paidCount: 1
        fulfillmentCount: 1

  - name: ledger has one payment entry
    method: GET
    url: http://localhost:8080/test/ledger/order_123
    expect:
      status: 200
      json:
        paymentEntries: 1
```

Why this shape:

- it is language-agnostic
- it avoids database credentials
- it is easy to run locally
- it can later evolve into CI checks

Tradeoff: you need to expose local or test-only debug/assertion endpoints.

## CLI

Show help:

```bash
node bin/payhook.js --help
```

List scenarios:

```bash
node bin/payhook.js list
```

Run a scenario:

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Options:

```text
--target <url>      Webhook endpoint receiving Stripe-style events
--assert <file>     Assertion YAML file
--secret <secret>   Secret used to generate Stripe-style webhook signatures
--timeoutMs <ms>    Per-event request timeout, default 10000
```

## Project Stage

This is a demand-validation prototype, not a production-ready product.

The important questions right now are:

- Have developers actually seen duplicate or retried webhooks cause production bugs?
- How do teams currently test webhook idempotency?
- Is a local CLI a natural first form factor?
- Should the next scenario be refunds, disputes, out-of-order delivery, or CI integration?

If the answer is negative, the right move is to stop or pivot instead of adding more features.

## Feedback Wanted

If you have integrated payment webhooks, I would especially like to learn:

1. Have duplicate, retried, delayed, or out-of-order webhooks caused real bugs for you?
2. How do you test webhook idempotency today?
3. Would you prefer this as a local CLI, GitHub Action, or hosted dashboard?
4. Is a Stripe-only first version useful enough?
5. Which scenario should be next?

## Silent Demo Materials

If you do not want to record English voiceover, you can record a silent terminal demo and use the included English captions or title cards:

- `demo-script.md`: recording script
- `demo-captions-en.srt`: English captions
- `demo-cards-en.md`: English title/transition card copy

The first validation video does not need to be polished. It only needs to show: fail once, fix idempotency, pass the same scenario.

## Roadmap

Short term:

- more Stripe scenarios
- stronger assertions, such as JSON path, array length, and numeric comparisons
- a more realistic Spring Boot demo
- machine-readable JSON reports

Mid term:

- GitHub Action / CI integration
- provider presets for PayPal, Paddle, Lemon Squeezy, and Adyen
- scenario chains such as payment succeeded then refunded, or payment succeeded then disputed
- local web UI for event timeline and assertion results

Long term:

- team collaboration and run history
- payment state-machine visualization
- webhook contract testing
- broader payment integration reliability suite
