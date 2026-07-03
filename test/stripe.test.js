import assert from "node:assert/strict";
import test from "node:test";

import { signStripePayload } from "../src/stripe.js";

test("signStripePayload creates stable HMAC SHA256 signature", () => {
  const signature = signStripePayload({
    secret: "whsec_test",
    timestamp: 123,
    body: '{"id":"evt_1"}',
  });

  assert.equal(signature, "94d2453cc7960463874f8b9ebad526244005352e0a5320ad624d93ecc2df970d");
});
