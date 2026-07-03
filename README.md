# PayHook

PayHook is a local-first CLI for stress-testing payment webhook handlers before production does.

Stripe and other payment providers can send duplicate, delayed, retried, or out-of-order webhook events. Your handler can return `200 OK` and still corrupt internal state by fulfilling an order twice, granting entitlement twice, or creating duplicate ledger entries.

PayHook replays messy but valid payment scenarios against your local app, then checks whether your order/payment state is still correct.

## Current MVP

Implemented:

- Stripe-style `duplicate-payment-succeeded` scenario
- signed Stripe-like webhook requests
- assertion checks against local HTTP debug endpoints
- Java demo service with both flawed and fixed webhook behavior

Planned:

- out-of-order payment lifecycle
- slow handler retry
- refund after payment
- dispute after payment
- GitHub Action / CI mode

## Requirements

- Node.js 20+
- Java 17+ for the demo service

No npm or Maven dependencies are required for the current MVP.

## Why This Exists

Most provider tools help you trigger a webhook. PayHook is focused on a different question:

> If payment webhooks arrive twice, late, or in an unexpected order, does your system still end in the correct state?

The MVP demo catches a common bug:

1. `checkout.session.completed` arrives.
2. the same event arrives again.
3. the app marks the order paid twice and creates duplicate ledger entries.

## Run Tests

```bash
npm test
```

## Run The Demo

From this directory:

```bash
mkdir -p /tmp/payhook-demo-classes
javac -d /tmp/payhook-demo-classes examples/java-http-stripe-demo/PayhookDemo.java
java -cp /tmp/payhook-demo-classes PayhookDemo
```

In another terminal:

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Expected result: the scenario should fail, because the demo webhook intentionally processes the duplicate checkout event twice.

Switch the demo service to the fixed idempotent mode:

```bash
curl -X POST http://localhost:8080/test/mode/dedupe
```

Run the same PayHook command again. Expected result: the scenario should pass, because the demo now dedupes by Stripe event id.

Switch back to flawed mode:

```bash
curl -X POST http://localhost:8080/test/mode/flawed
```

Reset demo state without changing mode:

```bash
curl -X POST http://localhost:8080/test/reset
```

## List Scenarios

```bash
node bin/payhook.js list
```

Only `stripe/duplicate-payment-succeeded` is implemented in the MVP. The other scenarios are listed as planned.

## Validation Status

This is currently a demand-validation prototype, not a production-ready product.

The next goal is to talk to developers who have integrated Stripe, PayPal, Adyen, Square, Paddle, Lemon Squeezy, or Shopify Payments and learn:

- whether duplicate/retried webhooks have caused real bugs
- how teams currently test idempotency
- whether a local CLI or CI check would be useful
- which payment provider and scenario should be supported next
