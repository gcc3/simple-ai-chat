export function getUsage(gpt4Usage = null, gpt4vUsage = null, dbUsage = null, midjourneyUsage = null) {
  let usage = {};

  if (gpt4Usage) {
    usage.gpt4 = gpt4Usage;
  }

  if (gpt4vUsage) {
    usage.gpt4v = gpt4vUsage;
  }

  if (dbUsage) {
    usage.db = dbUsage;
  }

  if (midjourneyUsage) {
    usage.midjourney = midjourneyUsage;
  }

  return usage;
}