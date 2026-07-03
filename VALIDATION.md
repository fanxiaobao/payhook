# PayHook 需求验证计划

这份文档不是产品路线图，而是第一轮需求验证手册。

当前阶段的目标不是涨 star，也不是做一次正式 launch，而是确认：

> 支付 Webhook 幂等和状态机可靠性，是否是开发者愿意花时间试用工具解决的问题？

## 一句话定位

PayHook 是一个本地 CLI，用来模拟重复、重试、乱序等支付 Webhook 场景，并检查你的订单、履约、权益、账务状态是否仍然正确。

## 当前验证假设

核心假设：

> 做支付集成的开发者，确实担心重复 Webhook、重试 Webhook 或乱序事件导致内部状态错误；如果有一个本地 CLI 能在上线前抓出这类问题，他们愿意试用。

拆开看，有几个子假设：

1. 开发者知道支付 Webhook 可能重复投递或重试。
2. 开发者遇到过或担心过重复履约、重复发放权益、重复入账。
3. 现有工具主要解决“能不能发事件”，没有很好解决“我的业务状态最后对不对”。
4. 本地 CLI 是一个可以接受的第一版形态。
5. Stripe-only 的 MVP 也足够让一部分用户感兴趣。

## 不要验证什么

第一轮不要急着验证：

- 完整定价
- SaaS 账号系统
- hosted dashboard
- 多支付平台覆盖
- UI 是否精美
- 企业客户是否愿意采购

这些太早了。现在只验证痛点和试用意愿。

## 目标用户

优先找这些人：

- SaaS 创业者
- 接过 Stripe Billing / Checkout 的开发者
- 做过订阅、付费墙、会员权益的后端
- 做过电商订单履约的开发者
- 做过支付、账务、退款、拒付流程的工程师
- agency / freelancer，给客户集成过支付

暂时不要优先找：

- 完全没接触过支付的人
- 只做前端展示、不碰后端状态的人
- 大公司采购或安全合规负责人
- 对工具细节没有发言权的人

## 核心问题

和用户交流时，优先问这些问题：

1. 你接过哪些支付平台？Stripe、PayPal、Paddle、Adyen、Lemon Squeezy、Shopify Payments，还是别的？
2. 你是否遇到过重复 Webhook、重试 Webhook 或乱序事件？
3. 这些事件有没有导致过重复履约、重复发放权益、重复账务记录、订单状态错误？
4. 你现在怎么测试 Webhook 幂等？
5. 你会不会在本地或 CI 里跑一个 CLI 来验证支付状态？
6. 你更希望它怎么接入：CLI、GitHub Action、测试框架插件，还是 hosted dashboard？
7. 如果只支持 Stripe，你是否仍然愿意试？
8. 下一个最有价值的场景是什么：退款、拒付、订阅续费失败、乱序、慢处理重试？

## 成功标准

继续投入的信号：

- 5 个以上开发者明确说自己遇到过类似问题。
- 3 个以上开发者愿意 clone repo 试一下。
- 1 个以上开发者主动问是否能接入 CI。
- 有人分享真实事故，例如重复履约、重复发券、重复入账、退款状态错乱。
- 有人指出当前 MVP 缺的具体场景，而不是只说“挺有意思”。

弱信号：

- 只给 star。
- 只说“cool project”。
- 只讨论技术实现，不讨论自己是否遇到过这个痛点。
- 觉得可以做，但没人愿意试。

停止或转向的信号：

- 大多数人理解了问题，但表示不关心。
- 大多数人认为 Stripe CLI / provider dashboard 已经足够。
- 没有人愿意在本地跑一次 demo。
- 只有很大团队感兴趣，但都需要企业级流程、权限、审计和长销售周期。

## 发布渠道

第一批建议只发 2-3 个渠道，不要到处群发。

优先级：

1. Reddit `r/SaaS`
2. Reddit `r/stripe`
3. Reddit `r/webdev`
4. Hacker News `Show HN`
5. Indie Hackers
6. 你认识的后端、SaaS、支付开发者私聊

建议先发 Reddit 或私聊，不要一开始就 Product Hunt。

原因：Product Hunt 更像 launch，不适合早期问题验证。现在更需要评论里有人说“我遇到过这个问题”。

## Reddit / Indie Hackers 发帖草稿

标题备选：

```text
How do you test Stripe webhook idempotency?
```

```text
I built a tiny CLI to catch duplicate Stripe webhook bugs
```

```text
Have duplicate payment webhooks ever caused bugs in your app?
```

正文：

```text
I am validating a small dev tool idea for people who integrate payment webhooks.

The problem:
Payment providers can send duplicate or retried webhook events. Your endpoint can return 200 OK, but your app may still mutate internal state twice, such as duplicate fulfillment, duplicate entitlement, or duplicate ledger entries.

I built a tiny local CLI prototype called PayHook.

The first scenario sends a Stripe-style checkout.session.completed event twice, then calls local assertion endpoints to check whether the order was paid once and whether only one ledger entry was created.

Demo repo:
https://github.com/fanxiaobao/payhook

I am not trying to sell anything yet. I am trying to understand whether this is a real enough pain to keep building.

Questions:
- How do you currently test Stripe webhook idempotency?
- Have duplicate or retried webhooks ever caused real bugs for you?
- Would you use this as a local CLI, a GitHub Action, or a hosted dashboard?
```

## Hacker News 草稿

```text
Show HN: PayHook - a local CLI for testing payment webhook idempotency

I built a small prototype for testing a failure mode I have seen in payment integrations: a webhook handler returns 200 OK, but still mutates internal state incorrectly when duplicate or retried payment events arrive.

The first scenario sends a Stripe-style checkout.session.completed event twice. Then it calls local assertion endpoints to verify that the app only marked the order paid once and only created one ledger entry.

The demo intentionally fails first, then passes after switching the sample handler to dedupe by Stripe event id.

Repo:
https://github.com/fanxiaobao/payhook

This is a demand-validation prototype, not a polished product.

Questions:
- How do you test webhook idempotency today?
- Would this be more useful as a local CLI, GitHub Action, or hosted test runner?
- Which payment scenario should be next: refund, dispute, subscription renewal, or out-of-order delivery?
```

## 私信草稿

中文：

```text
想问你一个支付/后端相关的小问题。

我在验证一个开发者工具想法：本地 CLI 模拟重复、重试、乱序的支付 Webhook，然后检查订单、履约、权益、账务状态最后是否仍然正确。

第一个 demo 是 Stripe 风格的 checkout.session.completed 重复到达，看看会不会导致重复履约或重复入账。

你之前接支付 Webhook 的时候，有遇到过这类问题吗？你们一般怎么测试 Webhook 幂等？

Repo 在这里：
https://github.com/fanxiaobao/payhook
```

英文：

```text
Quick question since you have worked on backend/payment flows.

I am validating a tiny dev tool idea: a local CLI that stress-tests payment webhook handlers with duplicate/retried/out-of-order events, then checks whether the app's order/payment state stays correct.

The first demo catches duplicate Stripe checkout.session.completed causing duplicate fulfillment or ledger entries.

Have you ever seen this class of bug? How do you normally test webhook idempotency?

Repo:
https://github.com/fanxiaobao/payhook
```

## 反馈记录表

| Date | Person / Channel | Payment experience | Has felt pain? | Current workaround | Wants to try? | Next scenario requested | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

记录时不要只记“好评/差评”，要记录具体上下文：

- 用的哪个支付平台
- 处理的是一次性支付、订阅、电商订单，还是钱包/账务
- 事故是否真实发生过
- 当前怎么测试
- 是否愿意 clone repo
- 对方希望下一个支持什么

## 第一轮执行计划

第 1 天：

- 录 60 秒 demo。
- 发给 5 个认识的开发者。
- 不解释太多，先看对方是否能理解。

第 2 天：

- 发 1 个 Reddit 帖子。
- 认真回复评论。
- 追问具体场景，不争论产品形态。

第 3 天：

- 根据反馈补 README 的 FAQ。
- 如果有人愿意试，优先帮对方跑通。

第 4-5 天：

- 决定下一步：
  - 如果大家都问 CI，就做 GitHub Action。
  - 如果大家都问退款/拒付，就做新场景。
  - 如果大家不关心，就暂停，不继续堆功能。

## 回复评论的原则

好的回复方式：

- 追问真实经历。
- 承认当前只是 MVP。
- 问对方现有 workflow。
- 问是否愿意试用。

不要这样回复：

- 上来推销。
- 和别人争论 Stripe CLI 是否足够。
- 过早讨论定价。
- 一次性发太多链接。

## 当前最想验证的问题

最重要的问题只有一个：

> 这个 bug 类型是否足够痛，以至于开发者愿意在本地或 CI 里多跑一个工具？

如果答案是肯定的，再谈产品化。
