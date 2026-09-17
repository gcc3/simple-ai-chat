// Run with: node --experimental-vm-modules --test tests/decision.test.js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { decisionPrompt, decisionRefinementPrompt, normalizeDecisionInput, parseDecision } from "../utils/decision.js";

const decision = {
  options: ["上海", "东京"],
  dimensions: [{
    name: "房价",
    options: [
      { name: "上海", pros_cons: "优点是郊区房源选择多；缺点是核心区域房价较高。" },
      { name: "东京", pros_cons: "优点是租赁房源供应充足；缺点是市中心租金较高。" },
    ],
    analysis: "住房负担取决于目标区域、面积以及当地收入。",
    conclusion: "应按目标区域、面积和收入比较住房负担。",
  }],
  overall_analysis: "先根据预算和生活习惯比较居住成本。",
  overall_conclusion: "根据工作地点、预算和语言能力选择。",
};
const question = "比较上海和东京居住哪里好";
const background = "在外企做软件开发，预算有限，会说一点日语。";
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
    async request(body = { question, background: ` ${background} ` }, method = "POST") {
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

test("returns a decision object from a question and background and records usage", async () => {
  const app = await setup({ authenticated: true });
  const response = await app.request();
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), decision);
  assert.deepEqual(Object.keys(response.body), ["options", "dimensions", "overall_analysis", "overall_conclusion"]);
  assert.deepEqual(Object.keys(response.body.dimensions[0]), ["name", "options", "analysis", "conclusion"]);
  assert.deepEqual(Object.keys(response.body.dimensions[0].options[0]), ["name", "pros_cons"]);
  assert.equal(app.calls.completions[0].messages[1].content, JSON.stringify({ question, background }));
  assert.equal(app.calls.completions[0].messages[0].content, decisionPrompt);
  assert.equal(app.calls.completions[0].response_format.type, "json_object");
  assert.equal(app.calls.sessions.length, 1);
  assert.deepEqual(app.calls.usage[0], ["test", 0.5]);
  assert.equal(app.calls.logs[0][7], JSON.stringify(decision));
});

test("supports the existing user_input parameter", async () => {
  const app = await setup();
  assert.equal((await app.request({ user_input: " 上海还是东京？ " })).statusCode, 200);
  assert.deepEqual(JSON.parse(app.calls.completions[0].messages[1].content), { question: "上海还是东京？", background: "" });
});

test("rejects invalid input before model calls or database writes", async () => {
  const app = await setup();
  for (const body of [{}, { question: " " }, { question: 1 }, { question: [] }, { question: "选择城市", session: "bad" },
    { background }, { question, background: 1 }, { question, background: null }, { question, background: [background] }]) {
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
    JSON.stringify({ ...decision, options: decision.dimensions[0].options })]) {
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
  for (const override of [
    { overall_analysis: " " }, { overall_analysis: undefined }, { overall_analysis: 1 },
    { options: [] }, { options: ["上海"] }, { options: ["上海", " 上海 "] },
    { options: ["上海", null] }, { options: ["上海", ""] }, { options: decision.dimensions[0].options },
    { dimensions: [] }, { dimensions: [null] }, { dimensions: ["房价"] },
    { dimensions: [{ ...decision.dimensions[0], conclusion: "" }] }, { overall_conclusion: null },
  ]) {
    assert.throws(() => parseDecision(JSON.stringify({ ...decision, ...override })), /invalid decision JSON/);
  }
});

test("requires pros_cons for every option in every dimension", async () => {
  const [dimension] = decision.dimensions;
  const [shanghai, tokyo] = dimension.options;
  for (const options of [
    undefined, null, {}, [], [shanghai], [shanghai, shanghai], [shanghai, null], [shanghai, "东京"],
    [shanghai, { ...tokyo, name: "大阪" }], [shanghai, { ...tokyo, name: "" }],
    [shanghai, tokyo, { name: "大阪", pros_cons: "优点是生活成本较低；缺点是工作机会较少。" }],
    ...[undefined, "", " ", null, 1, ["优点"], {}].map((pros_cons) => [shanghai, { ...tokyo, pros_cons }]),
  ]) {
    const output = JSON.stringify({ ...decision, dimensions: [{ ...dimension, options }] });
    assert.throws(() => parseDecision(output), /invalid decision JSON/);
    const app = await setup({ output });
    assert.equal((await app.request()).statusCode, 502);
  }
});

test("orders each dimension's pros_cons by the decision options", () => {
  const [dimension] = decision.dimensions;
  const [shanghai, tokyo] = dimension.options;
  const output = JSON.stringify({ ...decision, dimensions: [{ ...dimension, options: [{ ...tokyo, name: " 东京 " }, shanghai] }] });
  assert.deepEqual(parseDecision(output), decision);
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
    { question: JSON.stringify(decision) }, { user_input: JSON.stringify(decision) }]
    .map((body) => ({ ...body, background }))) {
    const app = await setup({ output: JSON.stringify(improved) });
    const response = await app.request(body);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(JSON.stringify(response.body)), improved);
    const messages = app.calls.completions[0].messages;
    assert.equal(messages[0].content, decisionRefinementPrompt);
    assert.deepEqual(JSON.parse(messages[1].content), { question: decision, background });
    assert.deepEqual(JSON.parse(app.calls.logs[0][5]), { question: decision, background });
  }
});

test("accepts incomplete drafts and keeps request settings out of the draft", async () => {
  const partialDimension = { name: "房价", options: [{ name: "东京", pros_cons: "" }], analysis: "" };
  for (const [draft, expected] of [
    [{ options: ["上海", "东京"], dimensions: [{ name: "房价", analysis: "" }] }],
    [{ dimensions: [{ ...partialDimension, options: [{ ...partialDimension.options[0], extra: "ignored" }] }] },
      { dimensions: [partialDimension] }],
    [{ dimensions: [{ options: [{ pros_cons: "交通便利" }] }] }],
  ]) {
    const app = await setup();
    const response = await app.request({ ...draft, model: "test-model", session: "1789600000000" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(app.calls.completions[0].messages[1].content), { question: expected ?? draft, background: "" });
    assert.equal(app.calls.completions[0].messages[0].content, decisionRefinementPrompt);
    assert.equal(app.calls.sessions[0][0], "1789600000000");
    assert.deepEqual(JSON.parse(JSON.stringify(response.body)), decision);
  }
});

test("rejects malformed drafts before generation", async () => {
  const app = await setup();
  for (const draft of [
    {}, [], { unrelated: "data" }, { overall_analysis: " " }, { overall_analysis: 1 },
    { options: "上海" }, { options: [1] }, { options: [null] }, { options: [{ name: "上海" }] }, { options: [] },
    { dimensions: {} }, { dimensions: [null] }, { dimensions: [{ name: 1 }] },
    { dimensions: [{ name: "房价", analysis: [] }] }, { dimensions: [{ name: "房价", options: {} }] },
    { dimensions: [{ options: ["上海"] }] }, { dimensions: [{ options: [null] }] }, { dimensions: [{ options: [{ name: 1 }] }] },
    { dimensions: [{ options: [{ name: "上海", pros_cons: ["交通便利"] }] }] },
    { dimensions: [{ options: [{ name: " ", pros_cons: "" }] }] },
    { options: ["上海"], overall_conclusion: false }, "{invalid", "[]",
  ]) {
    assert.equal((await app.request({ question: draft, background })).statusCode, 400);
  }
  assert.equal(app.calls.completions.length, 0);
  assert.equal(app.calls.sessions.length, 0);
});
