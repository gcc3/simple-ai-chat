import { getModels } from 'utils/sqliteUtils';

export default async function(req, res) {
  try {
    let models = await getModels();

    // Hide the API key
    models = models.map(model => {
      return {
        ...model,
        api_key: "***",
      };
    });

    // Output the result
    res.status(200).json({
      success: true,
      result: models,
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
