import { getUsageLimit, getAmount } from "utils/envUtils";

export default async function(req, res) {
  try {
    res.status(200).json({
      user: {
        name: "User",
        price: getAmount("user"),
        usage_limit: getUsageLimit("user"),
      },
      pro_user: {
        name: "Pro User",
        price: getAmount("pro_user"),
        usage_limit: getUsageLimit("pro_user"),
      },
      super_user: {
        name: "Super User",
        price : getAmount("super_user"),
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
