import { getUser, getStore, getUserStores, insertStore } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { createVectaraCorpus, generateVectaraApiKey, createVectaraJtwToken } from "utils/vectaraUtils.js";

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name } = req.body;

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
  const user = getUser(username);

  // Check store existance
  const sameNameStore = await getStore(name, username);
  if (sameNameStore) {
    return res.status(400).json({ 
      success: false, 
      error: "Store already exists." 
    });
  }

  // Store count limit
  const sameUserStores = await getUserStores(username);
  if (user.role === "user" && sameUserStores.length >= 0) {
    return res.status(400).json({ 
      success: false,
      error: "`user` cannot create data store."
    });
  } else if (user.role === "pro_user" && sameUserStores.length >= 1) {
    return res.status(400).json({ 
      success: false,
      error: "You've already created a data store."
    });
  } else if (user.role === "super_user" && sameUserStores.length >= 2) {
    return res.status(400).json({ 
      success: false,
      error: "Your can create at most 2 data stores."
    });
  }

  console.log("Creating store \"" + name + "\"...");

  // Get JWT token
  const jwtToken = await createVectaraJtwToken();
  if (!jwtToken) {
    console.log("Failed to get JTW token.");
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create store." 
    });
  }

  console.log("Got JTW token.");

  // Create store
  const corpusName = "i-" + Date.now();
  const description = "store: " + name + ", created by: " + username;
  const corpusId = await createVectaraCorpus(corpusName, description, jwtToken);
  if (!corpusId) {
    console.log("Failed to create corpus.");
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create store." 
    });
  }

  console.log("Created corpus: " + corpusId);

  // Get API key
  const apiKey = await generateVectaraApiKey(corpusId, jwtToken);
  if (!apiKey) {
    console.log("Failed to get API key.");
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create store." 
    });
  }

  console.log("Got API key.");

  const settings = JSON.stringify({
    "engine": "vectara",
    "corpusId": corpusId,
    "apiKey": apiKey,
  });

  insertStore(name, settings, username);
  return res.status(200).json({ 
    success: true,
    message: "Store \"" + name + "\" is created. You can use command `:store \"" + name + "\"` to check store status.",
  });
}
