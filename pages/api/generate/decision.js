import OpenAI from "openai";
import { authenticate } from "utils/auth";
import { verifySessionId } from "utils/session";
import { getUacResult } from "utils/uac";
import { getModels, getUser, addUserUsage } from "utils/sqlite";
import { getSystemConfigurations } from "utils/server/system";
import { ensureSession, logadd } from "utils/server/log";
import { decisionPrompt, decisionRefinementPrompt, normalizeDecisionInput, parseDecision } from "utils/decision.js";
import log from "../../../log.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const params = req.body || {};
  let input, isDraft;
  try {
    ({ input, isDraft } = normalizeDecisionInput(params.question ?? params.user_input ?? params, params.background));
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  const now = Date.now();
  const session = params.session ?? String(now);
  const verification = verifySessionId(session);
  if (!verification.success) {
    return res.status(400).json({ success: false, error: verification.error });
  }
  const requestedTime = Number(params.time);
  const time = Number.isFinite(requestedTime) && requestedTime > 0 ? requestedTime : now;
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || req.connection?.remoteAddress;
  const browser = req.headers["user-agent"];

  try {
    await log(req);
    const sysconf = getSystemConfigurations();
    const authResult = authenticate(req);
    const user = authResult.success ? await getUser(authResult.user.username) : null;

    if (sysconf.use_access_control) {
      const access = await getUacResult(user, ip, session, input);
      if (!access.success) {
        return res.status(400).json({ success: false, error: access.error });
      }
    }

    const modelName = params.model || sysconf.model;
    const models = await getModels();
    const model = models.find((item) => item.name === modelName);
    if (!model) {
      return res.status(500).json({ success: false, error: "Model not exists." });
    }
    if (!model.api_key || !model.base_url) {
      return res.status(500).json({ success: false, error: "Model's API key or base URL is not set." });
    }
    if (model.is_image === "1" || model.is_audio === "1") {
      return res.status(400).json({ success: false, error: "Decision generation requires a text model." });
    }

    await ensureSession(session, user ? user.username : "");
    const openai = new OpenAI({ apiKey: model.api_key, baseURL: model.base_url });
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: isDraft ? decisionRefinementPrompt : decisionPrompt },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
      n: 1,
      stream: false,
      temperature: sysconf.temperature,
      ...(user ? { user: user.username } : {}),
    });

    const choice = completion.choices?.[0];
    const output = choice?.message?.content || "";
    const usage = completion.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const cost = Number((inputTokens * Number(model.price_input || 0)
      + outputTokens * Number(model.price_output || 0)).toFixed(6));

    // Record completed model calls even when their output fails validation.
    if (user?.username) await addUserUsage(user.username, cost);
    await logadd(user, session, time, modelName, inputTokens, input,
      outputTokens, output, "[]", cost, ip, browser);

    let decision;
    try {
      if (choice?.finish_reason !== "stop" || choice?.message?.refusal) {
        throw new Error("Model did not return a complete decision.");
      }
      decision = parseDecision(output);
    } catch (error) {
      return res.status(502).json({ success: false, error: error.message });
    }

    return res.status(200).json(decision);
  } catch (error) {
    console.error("Error (Generate decision API):", error.message);
    return res.status(500).json({ success: false, error: "An error occurred during your request." });
  }
}
