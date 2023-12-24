import { executeFunction } from "function.js";

export default async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { functions } = req.body;

  try {
    const functionResults = Promise.all(functions.map(async (f) => {
      const funcName = f.split("(")[0];
      const funcArgs = f.split("(")[1].split(")")[0];
      try {
        const result = await executeFunction(funcName, funcArgs);
        if (!result.success) {
          throw new Error(result.error);
        }

        return {
          success: true,
          function: f,
          message: result.message,
          event: result.event,
        };
      } catch (error) {
        return {
          success: false,
          function: f,
          error: error.message,
        };
      }
    }));

    res.status(200).json({
      success: true,
      function_results: await functionResults
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: JSON.stringify(error),
    });
  }
}
