import { getLanguages } from "utils/langUtils";

export default async function (req, res) {
  try {
    const languages = getLanguages();

    res.status(200).json(languages);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
