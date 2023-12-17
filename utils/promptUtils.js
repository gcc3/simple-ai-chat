import { loglist } from './logUtils.js';
import { getRolePrompt } from './roleUtils.js';
import { getRole, getStore } from './sqliteUtils.js';
import { vectaraQuery } from "utils/vectaraUtils";
import { getAddress } from "utils/googleMapsUtils";
import { countToken } from "utils/tokenUtils";

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const use_vector = process.env.USE_VECTOR == "true" ? true : false;

// Generate messages for chatCompletion
export async function generateMessages(user, model, input, files, images, queryId, role, store, use_location, location, do_function_calling, functionName, functionMessage) {
  let messages = [];
  let token_ct = {};
  
  // -3. System master message, important
  if (role_content_system !== "") {
    messages.push({ 
      role: "system",
      content: role_content_system,
    });

    // Count tokens
    token_ct["system"] = countToken(model, role_content_system);
  }

  // -2. Role/assistant prompt
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

    // Count tokens
    token_ct["role"] = countToken(model, rolePrompt);
  }

  // -1. Chat history
  let chat_history_total_prompt = "";
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

      chat_history_total_prompt += log.input + log.output;
    });

    // Count tokens
    token_ct["history"] = countToken(model, chat_history_total_prompt);
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

    // Count tokens
    token_ct["user_input"] = countToken(model, input);
  }

  // 1. Function calling result
  if (do_function_calling) {
    // Feed message with function calling result
    messages.push({
      "role": "function",
      "name": functionName,
      "content": functionMessage,
    });

    // Count tokens
    token_ct["function"] = countToken(model, functionMessage);
  }

  // 2. Vector database query result
  let store_total_prompt = "";
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

          store_total_prompt += content;
        });
      }
    }

    // Count tokens
    token_ct["store"] = countToken(model, store_total_prompt);
  }
  
  // 3. Location info
  if (use_location && location) {
    // localtion example: (40.7128, -74.0060)
    const lat = location.slice(1, -1).split(",")[0].trim();
    const lng = location.slice(1, -1).split(",")[1].trim();
    const query = {latitude: lat, longitude: lng}

    let locationMessage = "Additional information:\n";

    // Get nearby cities
    const nearbyCities = require("nearby-cities")
    const cities = nearbyCities(query);
    const city = cities[0];
    locationMessage += "user is currently near city " + city.name + ", " + city.country + "\n";

    // Get user address with Google Maps API
    const address = await getAddress(lat, lng);
    locationMessage += "User accurate address: " + address + "\n";

    // Finish
    locationMessage += "Use this infromation if necessary.\n";

    // Feed with location message
    messages.push({
      "role": "system",
      "content": locationMessage
    });

    // Count tokens
    token_ct["location"] = countToken(model, locationMessage);
  }

  // Total token count
  let token_ct_total = 0;
  for (const key in token_ct) {
    token_ct_total += token_ct[key];
  }
  token_ct["total"] = token_ct_total;

  return {
    messages,
    token_ct,
  };
}
