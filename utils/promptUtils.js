import { loglist } from './logUtils.js';
import { getRolePrompt } from './roleUtils.js';
import { getRole } from './sqliteUtils.js';
import { getUser, getStore } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";
import { vectaraQuery } from "utils/vectaraUtils";
const nearbyCities = require("nearby-cities")

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const use_vector = process.env.USE_VECTOR == "true" ? true : false;

// Generate messages for chatCompletion
export async function generateMessages(user, input, images, queryId, role, store, use_location, location, do_function_calling, functionName, functionMessage) {
  let messages = [];
  let token_ct = 0;
  
  // -3. System message, important
  if (role_content_system !== "") {
    messages.push({ 
      role: "system",
      content: role_content_system,
    });
  }

  // -2. Role/assistant prompt
  let role_prompt = "";
  if (role !== "" && role !== "default") {
    // Default role prompt
    let rolePrompt = await getRolePrompt(role);

    // User role prompt
    if (user) {
      const userRole = await getRole(role, user.username);
      if (userRole) rolePrompt = userRole.prompt;
    }

    messages.push({
      role: "system",
      content: rolePrompt,
    });
    role_prompt = rolePrompt;
  }

  // -1. Chat history
  const session = queryId;
  const sessionLogs = await loglist(session, 7);  // limit the memory length to 7 logs
  if (sessionLogs && session.length > 0) {
    sessionLogs.reverse().map(log => {
      messages.push({ 
        role: "user",
        content: [
          {
            type: "text",
            text: log.input
          }
        ]
      });
      
      messages.push({ 
        role: "assistant", 
        content: log.output 
      });
    });
  }

  // 0. User input
  if (!do_function_calling) {
    messages.push({ 
      role: "user", 
      content: (() => {
        let c = [];

        // Text
        c.push({
            type: "text",
            text: input
        });

        // Vision model
        // If images is not empty, add image to content
        if (images && images.length > 0) {
          images.map(i => {
            if (i !== "") {
              c.push({
                type: "image",
                image_url: {
                  url: i
                }
              });
            }
          });
        }
        return c;
      })()  // Immediately-invoked function expression (IIFE)
    });
  }

  // 1. Function calling result
  let function_prompt = "";
  if (do_function_calling) {
    // Feed message with function calling result
    messages.push({
      "role": "function",
      "name": functionName,
      "content": functionMessage,
    });
    function_prompt = functionMessage;
  }

  // 2. Vector database query result
  let store_prompt = "";
  if (use_vector && store) {
    console.log("--- vector query ---");

    // Get corpus id
    const storeInfo = await getStore(store, user.username);
    const storeSettings = JSON.parse(storeInfo.settings);
    const corpus_id = storeSettings.corpus_id;
    if (corpus_id) {
      // Query
      const queryResult = await vectaraQuery(input, corpus_id);
      if (!queryResult) {
        console.log("response: no result.\n");
      } else {
        console.log("response: " + JSON.stringify(queryResult, null, 2) + "\n");
        queryResult.map(r => {
          const content = "According to " +  r.document + ": " + r.content;
          messages.push({
            "role": "system",
            "content": content,
          });
          store_prompt += content + "\n";
        });
      }
    }
  }
  
  // 3. Location info
  let location_prompt = "";
  if (use_location && location) {
    // localtion example: (40.7128, -74.0060)
    const lat = location.slice(1, -1).split(",")[0];
    const lng = location.slice(1, -1).split(",")[1];
    const query = {latitude: lat, longitude: lng}
    const cities = nearbyCities(query)
    const city = cities[0]
    const locationMessage = "Additional information: user is currently near city " + city.name + ", " + city.country + ". Use this infromation if necessary.";

    // Feed with location message
    messages.push({
      "role": "system",
      "content": locationMessage
    });
    location_prompt = locationMessage;
  }

  return {
    messages,
    token_ct,
    store_prompt,
    role_prompt,
    function_prompt,
    location_prompt
  };
}
