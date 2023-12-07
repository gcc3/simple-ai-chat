export function getUsageLimit(role) {
  if (role === "root_user") {
    return {
      daily_limit: Number.MAX_VALUE,
      weekly_limit: Number.MAX_VALUE,
      monthly_limit: Number.MAX_VALUE,
    };
  }

  const role_usage_limit = process.env.ROLE_USAGE_LIMIT ? process.env.ROLE_USAGE_LIMIT : "";
  const usage_limit = role_usage_limit.split(";").find((item) => item.split(":")[0] === role).split(":")[1];

  // If role is not found, return 0
  if (!usage_limit) {
    return {
      daily_limit: 0,
      weekly_limit: 0,
      monthly_limit: 0,
    };
  }

  let daily_limit = usage_limit.split(",")[0];
  if (daily_limit === "") {
    daily_limit = Number.MAX_VALUE;
  }

  let weekly_limit = usage_limit.split(",")[1];
  if (weekly_limit === "") {
    weekly_limit = Number.MAX_VALUE;
  }

  let monthly_limit = usage_limit.split(",")[2];
  if (monthly_limit === "") {
    monthly_limit = Number.MAX_VALUE;
  }
  
  return {
    daily_limit,
    weekly_limit,
    monthly_limit,
  }
}

export function getAmount(role) {
  const role_amount = process.env.ROLE_AMOUNT ? process.env.ROLE_AMOUNT : "";
  const amount = role_amount.split(";").find((item) => item.split(":")[0] === role).split(":")[1];
  return amount;
}
