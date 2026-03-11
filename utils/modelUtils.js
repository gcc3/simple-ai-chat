import { getModel } from './sqliteUtils.js';

export async function findModel(modelName) {
  return await getModel(modelName);
}
