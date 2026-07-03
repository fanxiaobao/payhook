# PayHook

PayHook 是一个本地优先的支付 Webhook 可靠性测试 CLI。

它的目标不是替代 Stripe CLI、Postman 或 webhook.site，而是回答一个更具体的问题：

> 当支付平台重复、重试、延迟或乱序发送 Webhook 时，你自己的订单、履约、权益、账务状态还能保持正确吗？

当前版本是一个需求验证原型，重点验证“支付 Webhook 幂等和状态机可靠性”这个痛点是否真实存在。

## 为什么要做这个

支付 Webhook 集成里，一个很常见的误区是：

> 接口返回了 `200 OK`，就说明 Webhook 处理没问题。

但真实风险往往发生在内部状态变更上。例如：

1. `checkout.session.completed` 到达一次。
2. 你的系统把订单标记为已支付。
3. 你的系统发放权益或触发履约。
4. 你的系统写入一条支付/账务记录。
5. 同一个 Webhook 因为平台重试或重复投递再次到达。
6. 接口仍然返回 `200 OK`。
7. 但内部又发放了一次权益，或者又写了一条账务记录。

这类问题在本地手工测试时很容易漏掉，因为开发者通常只测试“正常来一次事件”的路径。

PayHook 想做的是：把这些“不那么正常但真实存在”的支付事件投递方式变成可重复执行的本地测试。

## 当前 MVP 能做什么

当前只实现了一个最小闭环：

- 模拟 Stripe 风格的 `checkout.session.completed` 事件。
- 故意发送两次相同事件，模拟重复投递。
- 再发送一次 `payment_intent.succeeded`。
- 调用你提供的本地断言接口，检查订单和账务状态是否正确。
- 如果发现重复支付计数、重复履约、重复账务记录，就在命令行输出失败原因。

当前已实现：

- `stripe/duplicate-payment-succeeded` 场景
- Stripe 风格的签名请求
- YAML 格式的断言配置
- 一个 Java demo 服务
- demo 服务支持两种模式：
  - `flawed`：故意不做幂等，PayHook 应该检测失败
  - `dedupe`：按 Stripe event id 去重，PayHook 应该检测通过

计划中的后续场景：

- 支付生命周期乱序到达
- Webhook handler 处理太慢导致平台重试
- 支付成功后退款
- 支付成功后 dispute / chargeback
- GitHub Action / CI 模式

## 适合谁

PayHook 当前主要面向：

- 正在接 Stripe Webhook 的 SaaS 开发者
- 做订阅、付费墙、会员权益、订单履约的后端工程师
- 做支付、账务、结算、退款、拒付流程的工程师
- 想在上线前验证支付状态机幂等性的团队

它暂时不适合：

- 想要完整支付网关的人
- 想要可视化低代码测试平台的人
- 想要生产 Webhook 代理服务的人
- 不愿意暴露本地 debug/assertion endpoint 的用户

## 运行要求

- Node.js 20+
- Java 17+，仅用于运行 demo 服务

当前 MVP 没有 npm 依赖，也没有 Maven 依赖。

## 快速开始

进入项目目录：

```bash
cd payhook
```

运行测试：

```bash
npm test
```

列出当前支持的测试场景：

```bash
node bin/payhook.js list
```

输出示例：

```text
stripe/duplicate-payment-succeeded  ready
  Sends a checkout completion twice, then a payment success event.
stripe/out-of-order-payment-lifecycle  planned
  Replays a valid payment lifecycle in unexpected order.
```

## 运行 Demo

### 1. 启动 Java demo 服务

在第一个终端里运行：

```bash
cd payhook
mkdir -p /tmp/payhook-demo-classes
javac -d /tmp/payhook-demo-classes examples/java-http-stripe-demo/PayhookDemo.java
java -cp /tmp/payhook-demo-classes PayhookDemo
```

启动后你会看到：

```text
PayHook Java demo listening on http://localhost:8080
Webhook endpoint: http://localhost:8080/webhooks/stripe
Mode: flawed. POST /test/mode/dedupe to enable event-id dedupe.
```

默认是 `flawed` 模式，也就是故意没有做 Webhook 幂等。

### 2. 运行 PayHook 场景

在第二个终端里运行：

```bash
cd payhook
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

你应该看到类似结果：

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

注意：Webhook endpoint 都返回了 `200`，但内部状态已经错了。这就是 PayHook 想捕捉的问题。

### 3. 切换到修复后的幂等模式

运行：

```bash
curl -X POST http://localhost:8080/test/mode/dedupe
```

再次执行同一条 PayHook 命令：

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

这次应该通过：

```text
Checks:
  PASS order is paid once
  PASS ledger has one payment entry

Result: passed
```

这说明 demo 服务按 Stripe event id 做了去重以后，同样的重复事件不会再导致重复履约或重复账务记录。

## 断言文件是什么

PayHook 当前不会直接连接你的数据库，也不会绑定某一种语言或框架。

它采用一个更简单的方式：在事件发送完成后，调用你提供的本地 HTTP 检查接口。

示例文件：

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

这个设计的好处是：

- 不绑定 Java、Node、Python、Rails 或 Go。
- 不需要把数据库账号给 PayHook。
- 可以先作为本地测试工具跑起来。
- 后续可以自然扩展到 CI。

代价是：用户需要在本地或测试环境暴露一些 debug/assertion endpoint。

## 当前 CLI

查看帮助：

```bash
node bin/payhook.js --help
```

列出场景：

```bash
node bin/payhook.js list
```

运行场景：

```bash
node bin/payhook.js run stripe duplicate-payment-succeeded \
  --target http://localhost:8080/webhooks/stripe \
  --assert examples/java-http-stripe-demo/payhook.assert.yaml
```

可选参数：

```text
--target <url>      接收 Stripe 风格事件的 Webhook endpoint
--assert <file>     断言 YAML 文件
--secret <secret>   用于生成 Stripe 风格签名的 webhook secret
--timeoutMs <ms>    单个事件请求超时时间，默认 10000
```

## 这个项目现在处于什么阶段

这是一个需求验证原型，不是生产级产品。

当前最重要的问题不是“功能够不够多”，而是：

- 开发者是否真的遇到过重复 Webhook / 重试 Webhook 导致的线上 bug？
- 团队现在如何测试 Webhook 幂等？
- 本地 CLI 这种形态是否足够自然？
- 下一个最有价值的场景是退款、拒付、乱序，还是 CI 集成？

如果这些问题没有得到正向反馈，就不应该继续堆功能。

## 反馈问题

如果你做过支付 Webhook 集成，最想听到你的反馈：

1. 你是否遇到过重复 Webhook、重试 Webhook 或乱序事件导致的问题？
2. 你现在怎么测试 Webhook 幂等？
3. 你更想要本地 CLI、GitHub Action，还是 hosted dashboard？
4. Stripe-only 的第一版是否有价值？
5. 下一个应该支持什么场景？

## 路线图

短期：

- 支持更多 Stripe 场景
- 增强断言能力，例如 JSON path、数组长度、数值比较
- 增加更真实的 Spring Boot demo
- 输出机器可读的 JSON report

中期：

- GitHub Action / CI 集成
- PayPal / Paddle / Lemon Squeezy / Adyen provider preset
- 场景组合，例如支付成功后退款、支付成功后 dispute
- 本地 Web UI 展示事件时间线和断言结果

长期：

- 团队协作和测试历史
- 支付状态机可视化
- Webhook contract testing
- 支付集成可靠性测试套件
