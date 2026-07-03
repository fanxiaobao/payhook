# PayHook 60-Second Demo Script

This script is for recording a short silent terminal demo.

The goal is to show three things in under one minute:

1. Duplicate payment webhooks can corrupt internal state.
2. PayHook catches the bug.
3. The same scenario passes after event-id deduplication.

## Before Recording

Use a large terminal font and keep the screen simple.

Do not show:

- GitHub tokens
- SSH keys
- real payment provider secrets
- personal information

## Terminal 1: Start the demo service

```bash
cd payhook
mkdir -p /tmp/payhook-demo-classes
javac -d /tmp/payhook-demo-classes examples/java-http-stripe-demo/PayhookDemo.java
java -cp /tmp/payhook-demo-classes PayhookDemo
```

Expected output:

```text
PayHook Java demo listening on http://localhost:8080
Webhook endpoint: http://localhost:8080/webhooks/stripe
Mode: flawed. POST /test/mode/dedupe to enable event-id dedupe.
```

## Terminal 2: Prepare PayHook

```bash
cd payhook
```

## 0-10s: Problem

Show:

```bash
node bin/payhook.js list
```

Optional caption:

```text
Payment webhooks can be duplicated or retried.
Returning 200 OK does not always mean internal state is correct.
```

## 10-30s: Failing Handler

Optional caption:

```text
This demo handler has a common bug: it processes checkout.session.completed every time it arrives.
```

Run:

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Pause on:

```text
Events:
  1. checkout.session.completed     200
  2. checkout.session.completed     200  duplicate

Checks:
  FAIL order is paid once
       expected paidCount=1, got paidCount=2
       expected fulfillmentCount=1, got fulfillmentCount=2
  FAIL ledger has one payment entry
       expected paymentEntries=1, got paymentEntries=2
```

Optional caption:

```text
Every webhook returned 200 OK, but PayHook caught duplicate fulfillment and duplicate ledger state.
```

## 30-45s: Switch To Fixed Mode

Run:

```bash
curl -X POST http://localhost:8080/test/mode/dedupe
```

Expected output:

```text
{"mode":"dedupe","reset":true}
```

Optional caption:

```text
Now the handler dedupes by Stripe event id.
```

## 45-60s: Same Scenario Passes

Run the same PayHook command again:

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Pause on:

```text
Checks:
  PASS order is paid once
  PASS ledger has one payment entry

Result: passed
```

Optional caption:

```text
Same duplicate webhook scenario. Now the app ends in the correct state.
```

## Ending Question

End with:

```text
How do you test payment webhook idempotency today?
```

## Short Post Caption

```text
I built a tiny local CLI to test payment webhook idempotency.

The demo sends a duplicate Stripe-style checkout.session.completed event. The flawed handler returns 200 OK but creates duplicate fulfillment and ledger entries. After deduping by event id, the same scenario passes.

How do you test webhook idempotency today?
```
