import getTime from "functions/get_time.js";

export default async function (req, res) {
  try {
    res.status(200).json({
      result: {
        time: await getTime(req.query.timezone)
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
