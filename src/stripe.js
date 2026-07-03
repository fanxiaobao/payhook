import crypto from "node:crypto";

export async function sendStripeEvent({ target, secret, event, timeoutMs }) {
  const body = JSON.stringify(event.payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signStripePayload({ secret, timestamp, body });
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": `t=${timestamp},v1=${signature}`,
        "user-agent": "payhook/0.1.0",
      },
      body,
      signal: controller.signal,
    });
    const responseBody = await response.text();
    return {
      status: response.status,
      durationMs: Date.now() - startedAt,
      body: responseBody,
    };
  } catch (error) {
    return {
      status: 0,
      durationMs: Date.now() - startedAt,
      error: error.name === "AbortError" ? "request timed out" : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function signStripePayload({ secret, timestamp, body }) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`, "utf8")
    .digest("hex");
}
