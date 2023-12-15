import { loglist } from './logUtils.js';
import { getRolePrompt } from './roleUtils.js';
import { getRole } from './sqliteUtils.js';

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";

// Generate messages for chatCompletion
export async function generateMessages(authUser, input, images, queryId, role, do_functioin_calling = false) {
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
  if (role !== "" && role !== "default") {
    // Default role prompt
    let rolePrompt = await getRolePrompt(role);

    // User role prompt
    if (authUser) {
      const userRole = await getRole(role, authUser.username);
      if (userRole) rolePrompt = userRole.prompt;
    }

    messages.push({
      role: "system",
      content: rolePrompt,
    });
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

  return {
    messages: messages,
    token_ct: token_ct,
  };
}
