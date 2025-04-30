import { getUser, getModel } from './sqliteUtils.js';

export async function findModel(modelName, username) {
  let model = null;
  const user = await getUser(username);

  // 1. user model
  model = await getModel(modelName, user.username);

  // 2. group model
  if (!model) {
    const groups = user.group.split(',');
    for (const group of groups) {
      if (!group || group === user.username) {
        continue;
      }
      model = await getModel(modelName, group);
      if (model) {
        break;
      }
    }
  }

  // 3. system model
  if (!model) {
    model = await getModel(modelName, 'root');
  }

  return model;
}
