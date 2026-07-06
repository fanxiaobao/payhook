# Free Stripe Webhook Reliability Audit

## Positioning

Instead of pitching PayHook as a CLI prototype, pitch a concrete service:

> I help SaaS teams find duplicate or retried Stripe webhook bugs before production.

The goal is not to sell software yet. The goal is to learn whether teams actually care about this failure mode.

## Offer

```text
Free 15-minute Stripe webhook reliability audit.

I will help check whether duplicate or retried Stripe webhook events could cause duplicate fulfillment, duplicate entitlement, or duplicate ledger/payment records in your app.
```

## What The Audit Checks

- Duplicate `checkout.session.completed`
- Duplicate `invoice.paid` or subscription payment events
- Slow handler retry behavior
- Whether the app dedupes by provider event id
- Whether final business state is asserted:
  - order status
  - entitlement count
  - fulfillment count
  - ledger/payment entry count

## What It Does Not Require

- No production credentials
- No database access
- No payment secrets
- No screen share if the user is not comfortable
- No commitment to use PayHook

## Suggested Call Flow

1. Ask which Stripe flow they use:
   - Checkout
   - Billing/subscriptions
   - Payment Intents
   - Connect
2. Ask how their webhook handler is structured.
3. Ask whether they store processed Stripe event ids.
4. Ask what side effects happen after a payment event:
   - entitlement
   - fulfillment
   - email
   - ledger
   - invoice state
5. Ask how they test duplicate/retried events today.
6. If relevant, offer the PayHook prototype as a local test runner.

## Success Signals

Strong:

- "We had this bug before."
- "We dedupe, but I am not sure we test it."
- "CI support would be useful."
- "Can it test invoice.paid / subscriptions?"
- "Can you look at our flow?"

Weak:

- "Cool idea."
- "Might be useful someday."
- "We use Stripe CLI" without any concern about business state.

Negative:

- "Stripe CLI is enough for us."
- "We do not care about duplicate events."
- "Our payment flow has no side effects worth testing."

## When To Share The Repo

Do not lead with the repo.

Share it only after the person shows interest:

```text
I have a tiny local prototype here:
https://github.com/fanxiaobao/payhook

It is rough, but it demonstrates the exact failure mode: the webhook returns 200, yet duplicate internal state is created.
```
