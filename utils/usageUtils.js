export function genUsage(gpt4Usage = null, gpt4vUsage = null, dbUsage = null, midjourneyUsage = null) {
  let usage = {};

  if (gpt4Usage) {
    usage.gpt4 = gpt4Usage;
  } else {
    usage.gpt4 = {
      counter: 0,
      token_input: 0,
      token_output: 0,
    }
  }

  if (gpt4vUsage) {
    usage.gpt4v = gpt4vUsage;
  } else {
    usage.gpt4v = {
      counter: 0,
      token_input: 0,
      token_output: 0,
    }
  }

  if (dbUsage) {
    usage.db = dbUsage;
  }

  if (midjourneyUsage) {
    usage.midjourney = midjourneyUsage;
  }

  return usage;
}

export function feeCal(usage) {
  const { gpt4, gpt4v, db, midjourney } = usage;
  const gpt4Fee = gpt4 ? (gpt4.token_input * 0.00001 + gpt4.token_output * 0.00003) : 0;
  const gpt4vFee = gpt4v ? (gpt4v.token_input * 0.00001 + gpt4v.token_output * 0.00003) : 0;
  const dbFee = db ? (db.size * (5 * 1024 / 1.25)) : 0;
  const midjourneyFee = midjourney ? (midjourney.count * 0.1) : 0;
  const totalFee = gpt4Fee + gpt4vFee + dbFee + midjourneyFee;
  return {
    gpt4Fee,
    gpt4vFee,
    dbFee,
    midjourneyFee,
    totalFee,
  }
}

export function getRoleFequencyLimit(role) {
  if (role === "root_user") {
    return {
      daily_limit: null,
      weekly_limit: null,
      monthly_limit: null,
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