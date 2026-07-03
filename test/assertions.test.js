import assert from "node:assert/strict";
import test from "node:test";

import { parseAssertionYaml } from "../src/assertions.js";

test("parseAssertionYaml parses simple checks", () => {
  const parsed = parseAssertionYaml(`
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
`);

  assert.equal(parsed.checks.length, 1);
  assert.deepEqual(parsed.checks[0], {
    name: "order is paid once",
    method: "GET",
    url: "http://localhost:8080/test/orders/order_123",
    expect: {
      status: 200,
      json: {
        status: "PAID",
        paidCount: 1,
        fulfillmentCount: 1,
      },
    },
  });
});
