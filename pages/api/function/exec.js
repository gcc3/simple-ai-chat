import { executeFunctions } from "ai/function.js";

export default async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { functions } = req.body;
  const lang = req.body.lang || "";
  if (!functions) {
    return res.status(400).json({
      success: false,
      error: "`functions` is required.",
    });
  }

  try {
    res.status(200).json({
      success: true,
      function_results: await executeFunctions(functions, lang),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: JSON.stringify(error),
    });
  }
}
