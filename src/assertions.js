import fs from "node:fs/promises";

export async function runAssertions(filePath) {
  const definition = await loadAssertionFile(filePath);
  const results = [];

  for (const check of definition.checks) {
    results.push(await runCheck(check));
  }

  return results;
}

export async function loadAssertionFile(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  return parseAssertionYaml(source);
}

export function parseAssertionYaml(source) {
  const checks = [];
  let current = null;
  let section = null;

  for (const rawLine of source.split(/\r?\n/)) {
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    if (!withoutComment.trim()) {
      continue;
    }

    const indent = withoutComment.match(/^ */)[0].length;
    const line = withoutComment.trim();

    if (line === "checks:") {
      continue;
    }

    if (indent === 2 && line.startsWith("- ")) {
      current = { expect: { json: {} } };
      checks.push(current);
      section = null;
      const rest = line.slice(2).trim();
      if (rest) {
        assignKeyValue(current, rest);
      }
      continue;
    }

    if (!current) {
      continue;
    }

    if (indent === 4) {
      if (line === "expect:") {
        section = "expect";
      } else {
        assignKeyValue(current, line);
      }
      continue;
    }

    if (indent === 6 && section === "expect") {
      if (line === "json:") {
        section = "json";
      } else {
        assignKeyValue(current.expect, line);
      }
      continue;
    }

    if (indent === 8 && section === "json") {
      assignKeyValue(current.expect.json, line);
    }
  }

  if (checks.length === 0) {
    throw new Error("Assertion file must contain at least one check.");
  }

  for (const check of checks) {
    if (!check.name || !check.method || !check.url) {
      throw new Error("Each assertion check must include name, method, and url.");
    }
  }

  return { checks };
}

async function runCheck(check) {
  const failures = [];
  let response;
  let bodyText = "";

  try {
    response = await fetch(check.url, { method: check.method });
    bodyText = await response.text();
  } catch (error) {
    return {
      name: check.name,
      pass: false,
      failures: [`request failed: ${error.message}`],
    };
  }

  if (check.expect?.status !== undefined && response.status !== check.expect.status) {
    failures.push(`expected status=${check.expect.status}, got status=${response.status}`);
  }

  if (check.expect?.json && Object.keys(check.expect.json).length > 0) {
    let actual;
    try {
      actual = JSON.parse(bodyText);
    } catch {
      failures.push("expected JSON response, got non-JSON body");
      actual = null;
    }

    if (actual) {
      for (const [key, expectedValue] of Object.entries(check.expect.json)) {
        const actualValue = actual[key];
        if (actualValue !== expectedValue) {
          failures.push(`expected ${key}=${expectedValue}, got ${key}=${actualValue}`);
        }
      }
    }
  }

  return {
    name: check.name,
    pass: failures.length === 0,
    failures,
  };
}

function assignKeyValue(target, line) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error(`Invalid assertion line: ${line}`);
  }
  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  target[key] = parseScalar(value);
}

function parseScalar(value) {
  if (value === "") {
    return {};
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}
