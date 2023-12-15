export function getUsage(gpt4Usage = null, gpt4vUsage = null, dbUsage = null, midjourneyUsage = null) {
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
    usage.gpt4 = {
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
