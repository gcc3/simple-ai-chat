import { getRolePrompt } from 'utils/roleUtils';

export default async function (req, res) {
  const { roleName } = req.query;

  try {
    // Output the result
    res.status(200).json({
      result: {
        role: roleName,
        prompt: await getRolePrompt(roleName)
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
