// Run with: node --experimental-vm-modules --test tests/decision.test.js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { decisionPrompt, decisionRefinementPrompt, normalizeDecisionInput, parseDecision } from "../utils/decision.js";

const decision = {
  options: [
    { name: "上海", advantages_disadvantages: "优势是中文环境、适应成本低；劣势是核心区域房价较高。" },
    { name: "东京", advantages_disadvantages: "优势是公共交通发达；劣势是需要日语能力。" },
  ],
  dimensions: [{ name: "房价", analysis: "住房负担取决于目标区域、面积以及当地收入。", conclusion: "应按目标区域、面积和收入比较住房负担。" }],
  overall_analysis: "先根据预算和生活习惯比较居住成本。",
  overall_conclusion: "根据工作地点、预算和语言能力选择。",
};
const source = await readFile(new URL("../pages/api/generate/decision.js", import.meta.url), "utf8");

async function setup({ output = JSON.stringify(decision), finishReason = "stop", denied = false, authenticated = false, upstreamError = false } = {}) {
  const calls = { completions: [], logs: [], usage: [], sessions: [] };
  const dependencies = {
    openai: { default: class {
      chat = { completions: { create: async (params) => {
        calls.completions.push(params);
        if (upstreamError) throw new Error("Provider unavailable");
        return {
          choices: [{ message: { content: output }, finish_reason: finishReason }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        };
      } } };
    } },
    "utils/auth": { authenticate: () => ({ success: authenticated, user: { username: "test" } }) },
    "utils/session": { verifySessionId: (value) => /^\d{13}$/.test(value)
      ? { success: true } : { success: false, error: "Invalid session." } },
    "utils/uac": { getUacResult: async () => ({ success: !denied, error: "Access denied." }) },
    "utils/sqlite": {
      getModels: async () => [{ name: "test-model", api_key: "test", base_url: "https://example.invalid", price_input: 0.01, price_output: 0.02 }],
      getUser: async () => ({ username: "test" }),
      addUserUsage: async (...args) => calls.usage.push(args),
    },
    "utils/server/system": { getSystemConfigurations: () => ({ model: "test-model", temperature: 1, use_access_control: true }) },
    "utils/server/log": {
      ensureSession: async (...args) => calls.sessions.push(args),
      logadd: async (...args) => calls.logs.push(args),
    },
    "utils/decision.js": { decisionPrompt, decisionRefinementPrompt, normalizeDecisionInput, parseDecision },
    "../../../log.js": { default: async () => {} },
  };
  const route = new SourceTextModule(source);
  await route.link((specifier) => {
    const exports = dependencies[specifier];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    });
  });
  await route.evaluate();

  return {
    calls,
    async request(body = { question: "比较上海和东京居住哪里好" }, method = "POST") {
      const response = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; return this; },
      };
      await route.namespace.default({ method, body, headers: {}, socket: { remoteAddress: "127.0.0.1" } }, response);
      return response;
    },
  };
}

test("returns a decision object from only a question and records usage", async () => {
  const app = await setup({ authenticated: true });
  const response = await app.request();
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), decision);
  assert.deepEqual(Object.keys(response.body), ["options", "dimensions", "overall_analysis", "overall_conclusion"]);
  assert.deepEqual(Object.keys(response.body.options[0]), ["name", "advantages_disadvantages"]);
  assert.equal(app.calls.completions[0].messages[1].content, "比较上海和东京居住哪里好");
  assert.equal(app.calls.completions[0].messages[0].content, decisionPrompt);
  assert.equal(app.calls.completions[0].response_format.type, "json_object");
  assert.equal(app.calls.sessions.length, 1);
  assert.deepEqual(app.calls.usage[0], ["test", 0.5]);
  assert.equal(app.calls.logs[0][7], JSON.stringify(decision));
});

test("supports the existing user_input parameter", async () => {
  const app = await setup();
  assert.equal((await app.request({ user_input: " 上海还是东京？ " })).statusCode, 200);
  assert.equal(app.calls.completions[0].messages[1].content, "上海还是东京？");
});

test("rejects invalid input before model calls or database writes", async () => {
  const app = await setup();
  for (const body of [{}, { question: " " }, { question: 1 }, { question: [] }, { question: "选择城市", session: "bad" }]) {
    assert.equal((await app.request(body)).statusCode, 400);
  }
  const response = await app.request(undefined, "GET");
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
  assert.equal(app.calls.completions.length, 0);
  assert.equal(app.calls.sessions.length, 0);
});

test("honors access control before generation", async () => {
  const app = await setup({ denied: true });
  assert.equal((await app.request()).statusCode, 400);
  assert.equal(app.calls.completions.length, 0);
  assert.equal(app.calls.sessions.length, 0);
});

test("rejects malformed and incomplete model output as upstream errors", async () => {
  for (const output of ["not json", "", "null", "{}", JSON.stringify({ ...decision, dimensions: [{ name: "房价" }] }),
    JSON.stringify({ ...decision, options: ["上海", "东京"] })]) {
    const app = await setup({ output });
    assert.equal((await app.request()).statusCode, 502);
    assert.equal(app.calls.logs.length, 1);
  }
  const app = await setup({ finishReason: "length" });
  assert.equal((await app.request()).statusCode, 502);
});

test("returns JSON errors on provider failure", async () => {
  const app = await setup({ upstreamError: true });
  const response = await app.request();
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.success, false);
  assert.equal(app.calls.usage.length, 0);
});

test("requires populated text, distinct options, dimensions and final conclusion", () => {
  const [shanghai, tokyo] = decision.options;
  for (const override of [
    { overall_analysis: " " }, { overall_analysis: undefined }, { overall_analysis: 1 },
    { options: [] }, { options: [shanghai] }, { options: [shanghai, { ...tokyo, name: " 上海 " }] },
    { options: [shanghai, null] }, { options: [shanghai, "东京"] }, { options: [shanghai, { ...tokyo, name: "" }] },
    { dimensions: [] }, { dimensions: [null] },
    { dimensions: [{ ...decision.dimensions[0], conclusion: "" }] }, { overall_conclusion: null },
  ]) {
    assert.throws(() => parseDecision(JSON.stringify({ ...decision, ...override })), /invalid decision JSON/);
  }
});

test("rejects missing, empty or non-string option advantages_disadvantages", async () => {
  for (const advantages_disadvantages of [undefined, "", " ", null, 1, ["优势"], {}]) {
    const output = JSON.stringify({
      ...decision,
      options: [decision.options[0], { ...decision.options[1], advantages_disadvantages }],
    });
    assert.throws(() => parseDecision(output), /invalid decision JSON/);
    const app = await setup({ output });
    assert.equal((await app.request()).statusCode, 502);
  }
});

test("rejects missing, empty or non-string dimension analysis", async () => {
  for (const analysis of [undefined, "", " ", null, 1, {}]) {
    const output = JSON.stringify({
      ...decision,
      dimensions: [{ ...decision.dimensions[0], analysis }],
    });
    assert.throws(() => parseDecision(output), /invalid decision JSON/);
    const app = await setup({ output });
    assert.equal((await app.request()).statusCode, 502);
  }
});

test("refines a decision sent directly, as an object, or as serialized JSON", async () => {
  const improved = { ...decision, overall_conclusion: "优化后的最终结论。" };
  for (const body of [decision, { question: decision }, { user_input: decision },
    { question: JSON.stringify(decision) }, { user_input: JSON.stringify(decision) }]) {
    const app = await setup({ output: JSON.stringify(improved) });
    const response = await app.request(body);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(JSON.stringify(response.body)), improved);
    const messages = app.calls.completions[0].messages;
    assert.equal(messages[0].content, decisionRefinementPrompt);
    assert.deepEqual(JSON.parse(messages[1].content), decision);
    assert.deepEqual(JSON.parse(app.calls.logs[0][5]), decision);
  }
});

test("accepts incomplete drafts and keeps request settings out of the draft", async () => {
  const partialOptions = { options: ["上海", { name: "东京", advantages_disadvantages: "" }] };
  for (const [draft, expected] of [
    [{ options: ["上海", "东京"], dimensions: [{ name: "房价", analysis: "" }] }],
    [{ options: ["上海", { ...partialOptions.options[1], extra: "ignored" }] }, partialOptions],
    [{ options: [{ advantages_disadvantages: "交通便利" }] }],
  ]) {
    const app = await setup();
    const response = await app.request({ ...draft, model: "test-model", session: "1789600000000" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(app.calls.completions[0].messages[1].content), expected ?? draft);
    assert.equal(app.calls.completions[0].messages[0].content, decisionRefinementPrompt);
    assert.equal(app.calls.sessions[0][0], "1789600000000");
    assert.deepEqual(JSON.parse(JSON.stringify(response.body)), decision);
  }
});

test("rejects malformed drafts before generation", async () => {
  const app = await setup();
  for (const draft of [
    {}, [], { unrelated: "data" }, { overall_analysis: " " }, { overall_analysis: 1 },
    { options: "上海" }, { options: [1] }, { options: [null] }, { options: [[]] }, { options: [] },
    { options: [{ name: 1 }] }, { options: [{ name: "上海", advantages_disadvantages: ["交通便利"] }] },
    { options: [{ name: "上海", advantages_disadvantages: 1 }] }, { options: [{ name: " ", advantages_disadvantages: "" }] },
    { dimensions: {} }, { dimensions: [null] }, { dimensions: [{ name: 1 }] },
    { dimensions: [{ name: "房价", analysis: [] }] },
    { options: ["上海"], overall_conclusion: false }, "{invalid", "[]",
  ]) {
    assert.equal((await app.request({ question: draft })).statusCode, 400);
  }
  assert.equal(app.calls.completions.length, 0);
  assert.equal(app.calls.sessions.length, 0);
});
