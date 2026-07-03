# 60-Second Demo Script

## Setup

Terminal 1:

```bash
cd payhook
mkdir -p /tmp/payhook-demo-classes
javac -d /tmp/payhook-demo-classes examples/java-http-stripe-demo/PayhookDemo.java
java -cp /tmp/payhook-demo-classes PayhookDemo
```

Terminal 2:

```bash
cd payhook
```

## Script

### 0-10s: Problem

Say:

```text
Stripe webhooks can be duplicated or retried. Returning 200 OK is not enough if your app mutates internal state twice.
```

Show:

```bash
node bin/payhook.js list
```

### 10-30s: Failing Handler

Say:

```text
This demo app has a common bug: it processes checkout.session.completed every time it arrives.
```

Run:

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Point out:

```text
The webhook returned 200, but PayHook caught duplicate paidCount, duplicate fulfillment, and duplicate ledger entries.
```

### 30-45s: Fix

Say:

```text
Now I switch the demo handler to dedupe by Stripe event id.
```

Run:

```bash
curl -X POST http://localhost:8080/test/mode/dedupe
```

### 45-60s: Passing Handler

Run the same PayHook command again:

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

Say:

```text
Same messy webhook scenario, but now the app ends in the correct state. That is the core idea: payment webhook reliability tests you can run locally before production.
```

## Recording Notes

- Keep terminal font large.
- Do not show secrets, tokens, or personal accounts.
- Keep the first video under 60 seconds.
- End with a question, not a sales pitch:

```text
How do you test webhook idempotency today?
```
