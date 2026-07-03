# Reddit Draft: r/SaaS

## Title

```text
How do you test Stripe webhook idempotency?
```

## Body

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

## Posting Notes

- Post manually first. Do not cross-post everywhere.
- If moderators remove it as promotion, repost later with the repo/demo links moved into a comment.
- Reply to comments by asking for concrete workflow and incidents, not by defending the tool.
