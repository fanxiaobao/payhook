import { runAssertions } from "./assertions.js";
import { getScenario, listScenarios } from "./scenarios.js";
import { sendStripeEvent } from "./stripe.js";

const DEFAULT_SECRET = "whsec_payhook_test_secret";

export async function main(args) {
  const [command, ...rest] = args;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    printScenarioList();
    return;
  }

  if (command === "run") {
    await runCommand(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function runCommand(args) {
  const [provider, scenarioName, ...flagArgs] = args;
  if (!provider || !scenarioName) {
    throw new Error("Usage: payhook run <provider> <scenario> --target <url> --assert <file>");
  }
  if (provider !== "stripe") {
    throw new Error(`Unsupported provider: ${provider}. The MVP supports only "stripe".`);
  }

  const flags = parseFlags(flagArgs);
  const target = requiredFlag(flags, "target");
  const assertFile = flags.assert;
  const secret = flags.secret || DEFAULT_SECRET;
  const scenario = getScenario(provider, scenarioName);

  console.log(`Scenario: ${provider}/${scenario.name}`);
  console.log(`Target:   ${target}`);
  console.log("");
  console.log("Events:");

  const eventResults = [];
  for (let index = 0; index < scenario.events.length; index += 1) {
    const event = scenario.events[index];
    const result = await sendStripeEvent({
      target,
      secret,
      event,
      timeoutMs: Number(flags.timeoutMs || 10000),
    });
    eventResults.push(result);
    printEventResult(index + 1, event, result);
  }

  let assertionResults = [];
  if (assertFile) {
    console.log("");
    console.log("Checks:");
    assertionResults = await runAssertions(assertFile);
    for (const result of assertionResults) {
      printAssertionResult(result);
    }
  }

  const failedEvents = eventResults.filter((result) => result.error || result.status < 200 || result.status > 299);
  const failedAssertions = assertionResults.filter((result) => !result.pass);
  const failed = failedEvents.length > 0 || failedAssertions.length > 0;

  console.log("");
  console.log(`Result: ${failed ? "failed" : "passed"}`);

  if (failed) {
    process.exitCode = 1;
  }
}

function parseFlags(args) {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

function requiredFlag(flags, key) {
  if (!flags[key]) {
    throw new Error(`Missing required flag: --${key}`);
  }
  return flags[key];
}

function printHelp() {
  console.log(`PayHook MVP

Usage:
  payhook list
  payhook run stripe duplicate-payment-succeeded --target <url> --assert <file>

Options:
  --target <url>      Webhook endpoint to receive Stripe-style events
  --assert <file>     Assertion YAML file
  --secret <secret>   Stripe webhook secret for signing events
  --timeoutMs <ms>    Per-event request timeout, default 10000
`);
}

function printScenarioList() {
  for (const scenario of listScenarios()) {
    const status = scenario.implemented ? "ready" : "planned";
    console.log(`${scenario.provider}/${scenario.name}  ${status}`);
    console.log(`  ${scenario.description}`);
  }
}

function printEventResult(number, event, result) {
  const duplicate = event.duplicateOf ? "  duplicate" : "";
  if (result.error) {
    console.log(`  ${number}. ${event.type.padEnd(30)} ERROR ${result.error}${duplicate}`);
    return;
  }
  console.log(`  ${number}. ${event.type.padEnd(30)} ${String(result.status).padEnd(3)}  ${String(result.durationMs).padStart(4)}ms${duplicate}`);
}

function printAssertionResult(result) {
  if (result.pass) {
    console.log(`  PASS ${result.name}`);
    return;
  }

  console.log(`  FAIL ${result.name}`);
  for (const failure of result.failures) {
    console.log(`       ${failure}`);
  }
}
