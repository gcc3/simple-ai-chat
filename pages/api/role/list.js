import { roleListing } from '../utils/roleUtils';

export default async function (req, res) {
  try {
    // const entries = [];
    const roles = await roleListing();

    // Output the result
    res.status(200).json({
      result: {
        roles : roles
      },
    });
  } catch (error) {
    console.error(error);

    // Consider adjusting the error handling logic for your use case
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
