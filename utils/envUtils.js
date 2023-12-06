export function getUsageLimit (role) {
  const usage_limit = process.env.USAGE_LIMIT ? process.env.USAGE_LIMIT : "";
  const role_usage_limit = usage_limit.split(";").find((item) => item.split(":")[0] === role).split(":")[1];

  // If role is not found, return 0
  if (!role_usage_limit) {
    return {
      daily_limit: 0,
      weekly_limit: 0,
      monthly_limit: 0,
    };
  }

  let daily_limit = role_usage_limit.split(",")[0];
  if (daily_limit === "") {
    daily_limit = Number.MAX_VALUE;
  }

  let weekly_limit = role_usage_limit.split(",")[1];
  if (weekly_limit === "") {
    weekly_limit = Number.MAX_VALUE;
  }

  let monthly_limit = role_usage_limit.split(",")[2];
  if (monthly_limit === "") {
    monthly_limit = Number.MAX_VALUE;
  }
  
  return {
    daily_limit,
    weekly_limit,
    monthly_limit,
  }
}
