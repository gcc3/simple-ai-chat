import { getRoleFequencyLimit } from "utils/usageUtils";

export default async function(req, res) {
  try {
    res.status(200).json({
      user: {
        name: "User",
        price: getRolePrice("user"),
        usage_limit: getRoleFequencyLimit("user"),
      },
      pro_user: {
        name: "Pro User",
        price: getRolePrice("pro_user"),
        usage_limit: getRoleFequencyLimit("pro_user"),
      },
      super_user: {
        name: "Super User",
        price : getRolePrice("super_user"),
        usage_limit: getRoleFequencyLimit("super_user"),
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

function getRolePrice(role) {
  const role_amount = process.env.NEXT_PUBLIC_ROLE_AMOUNT ? process.env.NEXT_PUBLIC_ROLE_AMOUNT : "";
  const amount = role_amount.split(";").find((item) => item.split(":")[0] === role).split(":")[1];
  return amount;
}