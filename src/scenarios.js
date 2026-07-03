const SCENARIOS = [
  {
    provider: "stripe",
    name: "duplicate-payment-succeeded",
    implemented: true,
    description: "Sends a checkout completion twice, then a payment success event.",
    events: [
      stripeEvent({
        id: "evt_payhook_checkout_completed_1",
        type: "checkout.session.completed",
        object: "checkout.session",
        data: {
          id: "cs_payhook_123",
          payment_intent: "pi_payhook_123",
          client_reference_id: "order_123",
          metadata: { orderId: "order_123" },
          payment_status: "paid",
          amount_total: 5000,
          currency: "usd",
        },
      }),
      {
        ...stripeEvent({
          id: "evt_payhook_checkout_completed_1",
          type: "checkout.session.completed",
          object: "checkout.session",
          data: {
            id: "cs_payhook_123",
            payment_intent: "pi_payhook_123",
            client_reference_id: "order_123",
            metadata: { orderId: "order_123" },
            payment_status: "paid",
            amount_total: 5000,
            currency: "usd",
          },
        }),
        duplicateOf: "evt_payhook_checkout_completed_1",
      },
      stripeEvent({
        id: "evt_payhook_payment_intent_succeeded_1",
        type: "payment_intent.succeeded",
        object: "payment_intent",
        data: {
          id: "pi_payhook_123",
          metadata: { orderId: "order_123" },
          status: "succeeded",
          amount_received: 5000,
          currency: "usd",
        },
      }),
    ],
  },
  planned("stripe", "out-of-order-payment-lifecycle", "Replays a valid payment lifecycle in unexpected order."),
  planned("stripe", "slow-handler-retry", "Retries an event after a slow or failed acknowledgement."),
  planned("stripe", "refund-after-payment", "Sends payment success followed by a refund event."),
  planned("stripe", "dispute-after-payment", "Sends payment success followed by a dispute event."),
];

export function listScenarios() {
  return SCENARIOS.map(({ provider, name, implemented, description }) => ({
    provider,
    name,
    implemented,
    description,
  }));
}

export function getScenario(provider, name) {
  const scenario = SCENARIOS.find((item) => item.provider === provider && item.name === name);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${provider}/${name}`);
  }
  if (!scenario.implemented) {
    throw new Error(`Scenario is planned but not implemented yet: ${provider}/${name}`);
  }
  return scenario;
}

function planned(provider, name, description) {
  return { provider, name, description, implemented: false, events: [] };
}

function stripeEvent({ id, type, object, data }) {
  return {
    id,
    type,
    payload: {
      id,
      object: "event",
      api_version: "2025-09-30.clover",
      created: 1710000000,
      livemode: false,
      pending_webhooks: 1,
      request: { id: "req_payhook", idempotency_key: null },
      type,
      data: {
        object: {
          object,
          ...data,
        },
      },
    },
  };
}
