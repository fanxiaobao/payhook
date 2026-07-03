# Demo Cards

Use these as silent title cards or overlay text for the demo video.

## Card 1: Title

```text
PayHook

Test payment webhook idempotency locally
```

## Card 2: Problem

```text
Payment webhooks can be duplicated or retried.

Your endpoint may return 200 OK,
but your internal state can still be wrong.
```

## Card 3: Common Bug

```text
Buggy handler:

Duplicate checkout.session.completed
creates duplicate fulfillment or ledger entries.
```

## Card 4: PayHook Scenario

```text
PayHook sends:

1. checkout.session.completed
2. checkout.session.completed again
3. payment_intent.succeeded
```

## Card 5: Failed Result

```text
The webhook returned 200 OK.

But PayHook caught:
- paidCount = 2
- fulfillmentCount = 2
- paymentEntries = 2
```

## Card 6: Fix

```text
Fix:

Dedupe by payment provider event id.
```

## Card 7: Passed Result

```text
Same duplicate webhook scenario.

Now the app ends in the correct state.
```

## Card 8: Question

```text
How do you test payment webhook idempotency today?

Repo:
github.com/fanxiaobao/payhook
```

## No-Voice Video Flow

1. Show Card 1 for 2 seconds.
2. Show Card 2 for 4 seconds.
3. Start terminal recording.
4. Run the flawed demo.
5. Show Card 5 after the failed output.
6. Switch to dedupe mode.
7. Run the same command again.
8. Show Card 7 after the passed output.
9. End with Card 8.
