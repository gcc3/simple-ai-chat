import { insertStore, countUserStores } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { findStore } from "utils/storeUtils.js";

export default async function (req, res) {
  // Check method
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name, engine } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Verify store name
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      error: "Store `name` is required and cannot be empty." 
    });
  }
  
  if (name.length > 32) {
    return res.status(400).json({ 
      success: false, 
      error: "Store `name` is at most 32 characters long." 
    });
  }

  // Check store existance
  const sameNameStore = await findStore(name, username);
  if (sameNameStore) {
    return res.status(409).json({ 
      success: false, 
      error: "Store already exists." 
    });
  }

  // Store count limit
  const sameUserStoresCount = (await countUserStores(username)).count;
  if (sameUserStoresCount >= 10) {
    return res.status(400).json({ 
      success: false,
      error: "Your can create at most 10 stores."
    });
  }

  let settings = {};
  let message = "Store \"" + name + "\" is created. You can use command `:store \"" + name + "\"` to check store status and settings.";

  // File store
  if (engine === "file") {
    settings = {
      files: [],
      description: "",
    }

    message += " Use `:store upload` to upload files to the store.";
  }

  // MySQL store
  if (engine === "mysql") {
    settings = {
      host: "",
      port: 3306,
      user: "",
      password: "",
      database: "",
      table: "",
      schema: "",
      tableColumnsDef: "",
      description: "",
    }

    message += " Use `:store set [key] [value]` to configure the connection and then use `:store init [engine]` to initialize from the configuration.";
  }

  message += " Store \"" + name + "\" is now active.";

  await insertStore(name, engine, JSON.stringify(settings), username);
  
  return res.status(200).json({ 
    success: true,
    message: message,
  });
}
