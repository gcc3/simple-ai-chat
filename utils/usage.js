export function getRoleFequencyLimit(role) {
  if (role === "root_user") {
    return {
      daily_limit: null,
      weekly_limit: null,
      monthly_limit: null,
    };
  }

  let usage_limit = null;
  const role_usage_limit = process.env.NEXT_PUBLIC_ROLE_USAGE_LIMIT || "";
  const foundItem = role_usage_limit.split(";").find((item) => {
    return item.split(":")[0] === role;
  });
  if (foundItem) {
    usage_limit = foundItem.split(":")[1];
  } else {
    console.error("Role not found for:", role);
  }

  // If role is not found, return 0
  if (!usage_limit) {
    return {
      daily_limit: 1,
      weekly_limit: 1,
      monthly_limit: 1,
    };
  }

  let daily_limit = usage_limit.split(",")[0];
  if (daily_limit === "") {
    daily_limit = null;
  }

  let weekly_limit = usage_limit.split(",")[1];
  if (weekly_limit === "") {
    weekly_limit = null;
  }

  let monthly_limit = usage_limit.split(",")[2];
  if (monthly_limit === "") {
    monthly_limit = null;
  }
  
  return {
    daily_limit,
    weekly_limit,
    monthly_limit,
  }
}
