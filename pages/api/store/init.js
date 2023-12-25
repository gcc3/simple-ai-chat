import { getUser, getStore, updateStoreSettings } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { createVectaraCorpus, generateVectaraApiKey, createVectaraJtwToken } from "utils/vectaraUtils.js";

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name, engine } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed.',
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Check store existance
  const store = await getStore(name, username);
  if (!store) {
    return res.status(400).json({ 
      success: false, 
      error: "Store not exist. Use command `:store add [name]` to create a store." 
    });
  }

  // Check engine existance
  if (!engine) {
    return res.status(400).json({ 
      success: false, 
      error: "Engine not specified." 
    });
  }

  // Check store settings existance
  if (store.settings && JSON.parse(store.settings).engine) {
    return res.status(400).json({ 
      success: false, 
      error: "Store already initialized." 
    });
  }

  console.log("Initializing store \"" + name + "\"...");

  if (engine === "vectara") {
    const initResult = await initializeVectaraStore();
    if (!initResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: initResult.error
      });
    }

    const settings = JSON.stringify(initResult.settings);
    updateStoreSettings(name, username, settings);
    return res.status(200).json({ 
      success: true,
      message: "Store \"" + name + "\" is initialized. You can use command `:store \"" + name + "\"` to check store status and settings.",
    });
  }

  if (engine === "mysql") {
    const initResult = await initializeMysqlStore();
    if (!initResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: initResult.error
      });
    }

    const settings = JSON.stringify(initResult.settings);
    updateStoreSettings(name, username, settings);
    return res.status(200).json({ 
      success: true,
      message: "Store \"" + name + "\" is initialized. You can use command `:store \"" + name + "\"` to check store status and settings.",
    });
  }

  return res.status(400).json({ 
    success: false, 
    error: "Engine not supported, supported engine: \"vectara\", \"mysql\"."
  });
}

async function initializeMysqlStore() {
  return {
    success: true,
    settings: {
      engine: "mysql",
      host: "",
      port: 3306,
      username: "",
      password: "",
      description: "",
    }
  }
}

async function initializeVectaraStore() {
  // Get JWT token
  const jwtToken = await createVectaraJtwToken();
  if (!jwtToken) {
    console.log("Failed to get JTW token.");
    return { 
      success: false, 
      error: "Failed to create store." 
    };
  }

  console.log("Got JTW token.");

  // Create store
  const corpusName = "i-" + Date.now();
  const description = "store: " + name + ", created by: " + username;
  const corpusId = await createVectaraCorpus(corpusName, description, jwtToken);
  if (!corpusId) {
    console.log("Failed to create corpus.");
    return { 
      success: false, 
      error: "Failed to create store." 
    };
  }

  console.log("Created corpus: " + corpusId);

  // Get API key
  const apiKey = await generateVectaraApiKey(corpusId, jwtToken);
  if (!apiKey) {
    console.log("Failed to get API key.");
    return { 
      success: false, 
      error: "Failed to create store." 
    };
  }

  console.log("Got API key.");

  const settings = {
    engine: "vectara",
    corpusId: corpusId,
    apiKey: apiKey,
    threshold: 0.6,
    numberOfResults: 5,
  };

  return {
    success: true,
    settings: settings
  }
}