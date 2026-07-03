# PayHook 60 秒录屏脚本

这份脚本用于录一个非常短的终端 demo。目标不是做精美宣传片，而是让开发者在 1 分钟内看懂：

1. 支付 Webhook 重复到达会造成什么问题。
2. PayHook 如何抓到这个问题。
3. 幂等修复后，同一个场景如何通过。

## 录屏前准备

建议终端字体调大，画面只保留两个终端窗口。

不要展示：

- GitHub token
- SSH key
- 真实支付平台密钥
- 个人隐私信息

## 终端 1：启动 demo 服务

```bash
cd payhook
mkdir -p /tmp/payhook-demo-classes
javac -d /tmp/payhook-demo-classes examples/java-http-stripe-demo/PayhookDemo.java
java -cp /tmp/payhook-demo-classes PayhookDemo
```

你应该看到：

```text
PayHook Java demo listening on http://localhost:8080
Webhook endpoint: http://localhost:8080/webhooks/stripe
Mode: flawed. POST /test/mode/dedupe to enable event-id dedupe.
```

## 终端 2：准备运行 PayHook

```bash
cd payhook
```

## 0-10 秒：说明问题

可以说：

```text
支付 Webhook 可能重复投递或重试。接口返回 200 OK 并不代表业务状态一定正确，因为你的系统可能重复履约、重复发放权益，或者重复写账务记录。
```

运行：

```bash
node bin/payhook.js list
```

## 10-30 秒：演示失败

可以说：

```text
这个 demo 服务故意有一个常见 bug：每次收到 checkout.session.completed 都直接处理，不按 Stripe event id 去重。
```

运行：

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

重点停留在这几行：

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

可以说：

```text
注意，Webhook 每次都返回了 200，但 PayHook 发现内部状态已经错了：支付计数、履约次数、账务记录都重复了。
```

## 30-45 秒：切到修复模式

可以说：

```text
现在切到修复后的模式：按 Stripe event id 做幂等去重。
```

运行：

```bash
curl -X POST http://localhost:8080/test/mode/dedupe
```

输出：

```text
{"mode":"dedupe","reset":true}
```

## 45-60 秒：同一场景通过

再次运行同一条 PayHook 命令：

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

重点停留在：

```text
Checks:
  PASS order is paid once
  PASS ledger has one payment entry

Result: passed
```

可以说：

```text
同样的重复 Webhook 场景，修复后业务状态保持正确。这就是 PayHook 的核心价值：在上线前，用可重复的本地测试抓支付 Webhook 幂等问题。
```

## 结尾问题

最后不要像销售广告，直接抛问题：

```text
你们现在是怎么测试支付 Webhook 幂等的？重复或重试 Webhook 有没有造成过真实 bug？
```

## 可选英文结尾

如果要发英文社区，可以结尾说：

```text
How do you test payment webhook idempotency today? Have duplicate or retried webhooks ever caused real bugs in your app?
```

## 录完以后

建议配文不要太长：

```text
I built a tiny local CLI to test payment webhook idempotency.

The demo sends a duplicate Stripe-style checkout.session.completed event. The flawed handler returns 200 OK but creates duplicate fulfillment and ledger entries. After deduping by event id, the same scenario passes.

How do you test webhook idempotency today?
```
