import { getStore } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { createVectaraJtwToken, uploadFileToVectaraCorpus } from "utils/vectaraUtils";

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name, files } = req.body;

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

  // Check role existance
  const store = await getStore(name, username);
  if (!store) {
    return res.status(404).json({ 
      success: false, 
      error: "Store not exists." 
    });
  }

  const settings = JSON.parse(store.settings);

  if (settings.engine === "vectara") {
    const uploadResult = await uploadFileToVectaraStore(settings, files[0]);
    if (!uploadResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: uploadResult.error 
      });
    }
    return res.status(200).json({ 
      success: true, 
      message: uploadResult.message 
    });
  }

  return res.status(400).json({ 
    success: false, 
    error: "Invalid engine for data upload." 
  });
}

async function uploadFileToVectaraStore(settings, file) {
  if (!settings.apiKey || !settings.corpusId || !settings.clientId || !settings.clientSecret || !settings.customerId) {
    return { 
      success: false, 
      error: "Store has invalid settings." 
    };
  }

  const jwtToken = await createVectaraJtwToken(settings.clientId, settings.clientSecret, settings.customerId, settings.apiKey);
  if (!jwtToken) {
    console.log("Failed to create JWT token.");
    return {
      success: false,
      error: "Failed to upload file.",
    };
  }

  // Upload file
  if (!await uploadFileToVectaraCorpus(settings.corpusId, file, jwtToken, settings.customerId)) {
    console.log("Failed to upload file.");
    return {
      success: false,
      error: "Failed to upload file.",
    };
  }

  return {
    success: true,
    message: "File uploaded to store \"" + name + "\", please wait for indexing.",
  };
}