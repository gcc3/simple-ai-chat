import { loglist } from './logUtils.js';
import { getRolePrompt } from './roleUtils.js';
import { getRole, getLastLogBySessionAndModel } from './sqliteUtils.js';
import { getAddress } from "utils/googleMapsUtils";
import { countToken } from "utils/tokenUtils";
import { fetchImageSize } from "utils/imageUtils";
import { getSystemConfigurations } from "utils/sysUtils";
import { findNode, queryNodeAI, isNodeConfigured } from "utils/nodeUtils";
import { findStore, isInitialized, searchVectaraStore, searchMysqlStore } from "utils/storeUtils";
import { generateMidjourneyPrompt } from "utils/midjourneyUtils";
import fetch from 'node-fetch';

// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// configurations
const { model, model_v, role_content_system, welcome_message, querying, waiting, init_placeholder, enter, temperature, top_p, max_tokens, use_function_calling, use_node_ai, use_payment, use_access_control, use_email } = getSystemConfigurations();

// Generate messages for chatCompletion
export async function generateMessages(use_system_role, 
                                       user, model, input, inputType, files, images,
                                       session, mem_limit = 7,
                                       role, store, node,
                                       use_location, location,
                                       use_function_calling, functionCalls, functionResults,
                                       updateStatus = null) {
  let messages = [];
  let token_ct = {};
  let mem = 0;
  let input_images = [];
  let node_input = "";
  let node_output = "";
  let node_output_images = [];
  
  // -3. System master message, important
  let system_prompt = "";
  if (use_system_role && role_content_system !== "") {
    system_prompt += role_content_system;

    messages.push({ 
      role: "system",
      content: system_prompt,
    });

    // Count tokens
    token_ct["system"] = countToken(model, system_prompt);
  }

  // -2. Role prompt
  let role_prompt = "";
  if (role !== "" && role !== "default") {
    // Default role prompt
    role_prompt = await getRolePrompt(role);

    // User role prompt
    if (user) {
      const userRole = await getRole(role, user.username);
      if (userRole) role_prompt = userRole.prompt;
    }

    messages.push({
      role: "system",
      content: role_prompt,
    });

    // Count tokens
    token_ct["role"] = countToken(model, role_prompt);
  }

  // -1. Chat history
  let chat_history_prompt = "";
  const sessionLogs = await loglist(session, mem_limit);  // limit the memory length in the chat history
  if (sessionLogs && sessionLogs.length > 0) {
    sessionLogs.reverse().map(log => {
      mem += 1;

      if (log.input.startsWith("F=") && log.output.startsWith("F=")) {
        // Each Tool call query and response log
        // The input will add "F=" as prefix
        // The output will add "F=" as prefix
        const c = JSON.parse(log.input.slice(2));
        
        // Find tool call id in messages
        let isFound = false;
        messages.map(m => {
          if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
            m.tool_calls.map(t => {
              if (t.id === c.id) isFound = true;
            });
          }
        });

        // Add tool call query
        // only if the tool call id is found in messages
        // If it is version model, function calling will be disabled as it is not supported
        if (isFound && use_function_calling) {
          const message = log.output.slice(2);
          messages.push({ 
            role: "tool",
            content: message,
            tool_call_id: c.id,
          });
        }
      } else {
        // Normal log
        // To record the original user input after the function calling
        // the input will add "Q=" as prefix
        if (log.input && !log.input.startsWith("Q=")) {
          messages.push({ 
            role: "user",
            content: [
              {
                type: "text",
                text: log.input
              }
            ]
          });
        }
        
        if (log.output) {
          if (log.output.startsWith("T=")) {
            // Tool call output log
            // The output will add "T=" as prefix
            // AI generated the tool call
            // If it is version model, function calling will be disabled as it is not supported
            if (use_function_calling) {
              messages.push({ 
                role: "assistant",
                tool_calls: JSON.parse(log.output.slice(2)),
              });
            }
          } else {
            // Normal output log
            messages.push({ 
              role: "assistant", 
              content: log.output 
            });
          }
        }
      }

      chat_history_prompt += log.input + log.output + "\n";
    });

    // Count tokens
    token_ct["history"] = countToken(model, chat_history_prompt);
  }

  // 0. User input
  let user_input_file_prompt = "";
  if (inputType !== TYPE.TOOL_CALL) {
    messages.push({ 
      role: "user", 
      content: await (async () => {
        let c = [];

        // Text
        c.push({
            type: "text",
            text: input
        });
        
        // Count tokens
        token_ct["user_input"] = countToken(model, input);

        // File input
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i] !== "") {
              try {
                const fileExtension = files[i].split('.').pop().split(/\#|\?/)[0].toLowerCase();
                const response = await fetch(files[i]);
                const pdfParse = require('pdf-parse');
                const mammoth = require('mammoth');
                
                // Get content form different file types
                let fileContent = "(file is empty)";
                if (fileExtension === "txt") {
                  fileContent = await response.text();
                } else if (fileExtension === "json") {
                  fileContent = JSON.stringify(await response.json(), null, 2);
                } else if (fileExtension === "csv") {
                  fileContent = await response.text();
                } else if (fileExtension === "pdf") {
                  const buffer = await response.buffer();
                  const data = await pdfParse(buffer);   // Use pdf-parse to extract text
                  fileContent = data.text;
                } else if (fileExtension === "docx") {
                  const buffer = await response.buffer();
                  const data = await mammoth.extractRawText({ buffer: buffer });  // Use mammoth to extract text
                  fileContent = data.value;
                }

                c.push({
                  type: "text",
                  text: "User input file content:\n" + fileContent,
                });
                user_input_file_prompt += fileContent;
              } catch (error) {
                const errorMessages = "Error fetching file:" + files[i] + "\n" + error;
                console.error(errorMessages);
                c.push({
                  type: "text",
                  text: errorMessages,
                });
                user_input_file_prompt += errorMessages;
              }
            }
          }
          token_ct["user_input_file"] = countToken(model, user_input_file_prompt);
        }

        // Vision model
        // If images is not empty, add image to content
        if (images && images.length > 0) {
          let image_token_ct = 0;
          const count_tokens_v = (w, h) => {
            return 85 + 170 * Math.ceil(w / 512) * Math.ceil(h / 512);
          };

          for (let i = 0; i < images.length; i++) {
            // Get image size
            const dimensions = await fetchImageSize(images[i])
            image_token_ct += count_tokens_v(dimensions.width, dimensions.height)
            if (i !== "") {
              c.push({
                type: "image",
                image_url: {
                  url: images[i]
                }
              });
              input_images.push(images[i]);
            }
          }
          token_ct["user_input_image"] = image_token_ct;
        }
        return c;
      })()  // Immediately-invoked function expression (IIFE)
    });
  }

  // 1. Function calling result
  // The latest function calling result, not the history
  let function_prompt = "";
  if (use_function_calling && inputType === TYPE.TOOL_CALL && functionResults && functionResults.length > 0) {
    for (let i = 0; i < functionResults.length; i++) {
      const f = functionResults[i];
      const c = functionCalls[i];
      
      if (c.type === "function" && c.function && c.function.name === f.function.split("(")[0].trim()) {
        // Find tool call id in messages
        let isFound = false;
        messages.map(m => {
          if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
            m.tool_calls.map(t => {
              if (t.id === c.id) isFound = true;
            });
          }
        });

        // Feed message with function calling result
        if (isFound) {
          messages.push({
            role: "tool",
            content: f.success ? f.message : "Error: " + f.error,
            tool_call_id: c.id,
          });

          function_prompt += f.message;
        }
      }
    }

    // Count tokens
    token_ct["function"] = countToken(model, function_prompt);
  }

  // 2. Data store search result
  let store_prompt = "";
  if (store && user) {
    updateStatus && updateStatus("Data store searching...");
    console.log("--- data store search ---");
    console.log("store: " + store);

    // Search all active stores
    const activeStores = store.split(",").filter(s => s !== "");
    for (const store of activeStores) {
      // Get store info
      const storeInfo = await findStore(store, user.username);
      const settings = JSON.parse(storeInfo.settings);

      if (isInitialized(storeInfo.engine, settings)) {
        let queryResult = null;
        console.log("store: " + storeInfo.name);

        let prompt = "";

        // Query
        if (storeInfo.engine === "vectara") {
          prompt += "\nQuery Vector database\n";
          prompt += "Database description: " + (settings.description || "No description") + "\n";
          queryResult = await searchVectaraStore(settings, input);
        } else if (storeInfo.engine === "mysql") {
          prompt += "\nQuery MySQL database\n";
          prompt += "Database description: " + (settings.description || "No description") + "\n";
          queryResult = await searchMysqlStore(settings, input);
        }

        if (queryResult.success) {
          if (queryResult.query) {
            prompt += "Query: " + queryResult.query + "\n";
          }
          prompt += "Query result: \n";
          prompt += queryResult.message.trim();
          messages.push({
            "role": "system",
            "content": prompt,
          });
          
          store_prompt += prompt;
          console.log("response: " + prompt.trim());
        }
      }
    }
    console.log("");  // add new line

    // Count tokens
    token_ct["store"] = countToken(model, store_prompt);
  }

  // 3. Node AI result
  let node_prompt = "";
  if (use_node_ai && node && user) {
    updateStatus && updateStatus("Node AI generating...");
    console.log("--- node ai ---");
    console.log("node: " + node);

    // Get node info
    const nodeInfo = await findNode(node, user.username);
    const settings = JSON.parse(nodeInfo.settings);

    if (isNodeConfigured(settings)) {
      node_input = input;

      // Midjourney
      // Override node_input
      let ar = 1;
      if (nodeInfo.name.toLowerCase() === "midjourney") {
        updateStatus && updateStatus("Midjourney prompt generating...");
        console.log("Midjourney prompt generating...");
        
        // Get last Midjourney prompt
        const lastMjLog = await getLastLogBySessionAndModel(session, "Midjourney");
        const lastMjPrompt = lastMjLog ? lastMjLog.input : null;
        if (lastMjPrompt) {
          updateStatus && updateStatus("last Midjourney prompt: " + lastMjPrompt);
          console.log("last Midjourney prompt: " + lastMjPrompt);
        }

        // Generate Midjourney prompt
        const mjPrompt = await generateMidjourneyPrompt(input, lastMjPrompt);

        // Get aspect ratio from the prompt
        const arPrompt = mjPrompt.match(/--ar\s+\d+:\d+/g);
        if (arPrompt && arPrompt.length > 0) {
          const wh = arPrompt[0].split(" ")[1].split(":").map(x => parseInt(x));
          ar = parseFloat((wh[0] / wh[1]).toFixed(6)).toString();
        }

        // It maybe empty, it's AI decided to put it empty, so override it anyway
        node_input = mjPrompt;
      }

      console.log("prompt: " + node_input.replace(/\n/g, " "));
      updateStatus && updateStatus("Node AI querying, prompt: " + node_input.replace(/\n/g, " "));

      // Prepare a keep alive
      async function sendKeepAlive(updateStatus) {
        let keepAlive = true;
        const keepAliveInterval = setInterval(() => {
          if (keepAlive) {
            updateStatus("Node AI is still processing...");
          }
        }, 1000);
      
        // Return a function to stop the keep-alive messages
        return () => {
          keepAlive = false;
          clearInterval(keepAliveInterval);
        };
      }

      // Start sending keep-alive messages
      const stopKeepAlive = await sendKeepAlive(updateStatus);

      // Perform the query
      const queryNodeAIResult = (await queryNodeAI(node_input, settings));

      // Stop sending keep-alive messages
      stopKeepAlive();
      updateStatus && updateStatus("Node AI responsed, result = " + JSON.stringify(queryNodeAIResult));

      if (queryNodeAIResult && queryNodeAIResult.success) {
        let content = "";

        // Format result
        if (typeof queryNodeAIResult.result === "string") {
          content += queryNodeAIResult.result;
        } else if (queryNodeAIResult.result.text || queryNodeAIResult.result.image) {

          // Node AI generated images
          if (queryNodeAIResult.result.images && queryNodeAIResult.result.images.length > 0) {

            node_output = queryNodeAIResult.result.text || "Here it is, a generated image.";
            node_output_images = queryNodeAIResult.result.images;

            // Add aspect ratio to each image
            for (let i = 0; i < node_output_images.length; i++) {
              if (!node_output_images[i].includes("?ar=")) {
                node_output_images[i] += "?ar=" + ar;
              }
            }

            // Pop out the real user input
            // the node input
            messages.pop();

            // Give this image to ChatGPT
            const fakeUserInput = "Evaluate this image, within 55 words."
            messages.push({
              "role": "user",
              "content": [
                {
                  type: "text",
                  text: fakeUserInput
                },
                {
                  type: "image",
                  image_url: {
                    url: node_output_images[0]
                  }
                }
              ]
            });
            input_images.push(node_output_images[0]);

            // add to node prompt for token count
            node_prompt += fakeUserInput;

            // TODO, count image token
          } else {
            content += queryNodeAIResult.result.text;
          }
        } else {
          content += "No result.";
        }

        if (content) {
          messages.push({
            "role": "system",
            "content": content,
          });
        }
        node_prompt += content;
      }
    }

    // Count tokens
    token_ct["node"] = countToken(model, node_prompt);
    console.log("response: " + node_output);
    if (node_output_images.length > 0) console.log("image: " + JSON.stringify(node_output_images));
    console.log("");
  }

  // 4. Location info
  let location_prompt = "";
  if (use_location && location && location !== "null") {
    updateStatus && updateStatus("Location info generating...");
    console.log("--- location info ---");

    // localtion example: (40.7128, -74.0060)
    const lat = location.slice(1, -1).split(",")[0].trim();
    const lng = location.slice(1, -1).split(",")[1].trim();
    console.log("lat: " + lat);
    console.log("lng: " + lng);

    location_prompt += "User location info:\n";

    // Get nearby cities
    const nearbyCities = require("nearby-cities")
    const cities = nearbyCities({latitude: lat, longitude: lng});
    const city = cities[0];
    location_prompt += "user is currently near city " + city.name + ", " + city.country + "\n";
    console.log("nearby_citie: " + city.name + ", " + city.country);

    // Get user address with Google Maps API
    if (process.env.GOOGLE_API_KEY) {
      const address = await getAddress(lat, lng);
      location_prompt += "User accurate address: " + address + "\n";
      console.log("address: " + address + "\n");
    }

    // Finish
    location_prompt += "Use this infromation if necessary.\n";

    // Feed with location message
    messages.push({
      "role": "system",
      "content": location_prompt
    });

    // Count tokens
    token_ct["location"] = countToken(model, location_prompt);
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
    mem,
    input_images,
    node_input,
    node_output,
    node_output_images,
    raw_prompt: {
      system: system_prompt,
      role: role_prompt,
      history: chat_history_prompt,
      user_input_file: user_input_file_prompt,
      function: function_prompt,
      store: store_prompt,
      node: node_prompt,
      location: location_prompt,
    }
  };
}
