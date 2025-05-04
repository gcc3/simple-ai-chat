import { getLanguages } from "utils/langUtils";

export default async function (req, res) {
  try {
    const languages = getLanguages();
    if (!languages) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Languages not found.",
        },
      });
    }

    res.status(200).json({
      success: true,
      languages: languages,
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
