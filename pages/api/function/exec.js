import { executeFunctions } from "function.js";

export default async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { functions } = req.body;
  if (!functions) {
    return res.status(400).json({
      success: false,
      error: "Functions is required.",
    });
  }

  try {
    res.status(200).json({
      success: true,
      function_results: await executeFunctions(functions),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: JSON.stringify(error),
    });
  }
}
