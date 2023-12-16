import { loglist } from './logUtils.js';
import { getRolePrompt } from './roleUtils.js';
import { getRole } from './sqliteUtils.js';
import { getUser, getStore } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";
import { vectaraQuery } from "utils/vectaraUtils";

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const use_vector = process.env.USE_VECTOR == "true" ? true : false;

// Generate messages for chatCompletion
export async function generateMessages(req, input, images, queryId, role, store, do_functioin_calling = false) {
  let messages = [];
  let token_ct = 0;

  // Authentication
  const authResult = authenticate(req);
  let user = null;
  let authUser = null;
  if (authResult.success) {
    authUser = authResult.user;
    user = await getUser(authResult.user.username);
  }
  
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
  if (!do_functioin_calling) {
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

  // 4. Vector database query result
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

  return {
    messages,
    token_ct,
    store_prompt,
    role_prompt,
  };
}
