import { getUsageLimit } from "utils/envUtils";

export default async function (req, res) {
  try {
    res.status(200).json({
      trial: {
        name: "Trial",
        princing: "Free",
        usage_limit: getUsageLimit("trial"),
      },
      user: {
        name: "User",
        pricing: "$1",
        usage_limit: getUsageLimit("user"),
      },
      super_user: {
        name: "Super User",
        pricing : "$10/month",
        usage_limit: getUsageLimit("super_user"),
      }
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
