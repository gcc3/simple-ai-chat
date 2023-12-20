import { executeFunction } from "function.js";

export default async function (req, res) {
  try {
    const functionResult = await executeFunction(req.query.func, req.query.args);
    res.status(200).json(functionResult);  // Use the function result directly as it include parameters
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error
    });
  }
}
