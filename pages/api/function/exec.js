import { executeFunction } from "function.js";

export default async function (req, res) {
  try {
    res.status(200).json({
      result: {
        time: await executeFunction(req.query.func, req.query.args)
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: {
        message : error
      },
    });
  }
}
