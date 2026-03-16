import { getSystemInfo } from "../utils/client/systemUtils.js";

export default async function system(args) {
  const systemInfo = await getSystemInfo();
  if (!systemInfo) {
    return "Failed to get system information.";
  }
  return JSON.stringify(systemInfo, null, 2);
}
