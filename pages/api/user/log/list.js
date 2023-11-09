import { loglist } from "utils/logUtils";

export default async function (req, res) {
  // Check if the method is GET.
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req, res);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }
  const { id, username } = authResult.user;

  try {
    const logs = await loglist(req.query.query_id);

    // Output the result
    res.status(200).json({
      result: {
        logs: logs,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
