import { loglist } from './logUtils.js';
import { getRolePrompt } from './roleUtils.js';
import { getRole, getStore, getNode } from './sqliteUtils.js';
import { vectaraQuery } from "utils/vectaraUtils";
import { getAddress } from "utils/googleMapsUtils";
import { countToken } from "utils/tokenUtils";
import { fetchImageSize } from "utils/imageUtils";
import { getSystemConfigurations } from "utils/sysUtils";
import queryNodeAi from "utils/nodeUtils";
const fetch = require('node-fetch');

// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// configurations
const { model, model_v, role_content_system, welcome_message, querying, waiting, init_placeholder, enter, temperature, top_p, max_tokens, use_function_calling, use_node_ai, use_vector, use_payment, use_access_control, use_email } = getSystemConfigurations();

// Generate messages for chatCompletion
export async function generateMessages(user, model, input, inputType, files, images,
                                       session, mem_length = 7,
                                       role, store, node,
                                       use_location, location,
                                       functionCalls, functionResults) {
  let messages = [];
  let token_ct = {};
  
  // -3. System master message, important
  let system_prompt = "";
  if (role_content_system !== "") {
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
  const sessionLogs = await loglist(session, mem_length);  // limit the memory length to 7 logs
  if (sessionLogs && session.length > 0) {
    sessionLogs.reverse().map(log => {
      if (log.input.startsWith("F=") && log.output.startsWith("F=")) {
        // Function calling log
        const input = log.input.slice(1);
        const output = log.output.slice(2);
        const functionName = input.slice(1).split("(")[0];
        const functionMessage = output;
        messages.push({ 
          role: "function",
          name: functionName,
          content: functionMessage,
        });
      } else {
        // Normal log
        if (log.input) {
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
            messages.push({ 
              role: "assistant",
              tool_calls: JSON.parse(log.output.slice(2)),
            });
          } else {
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
            }
          }
          token_ct["user_input_image"] = image_token_ct;
        }
        return c;
      })()  // Immediately-invoked function expression (IIFE)
    });
  }

  // 1. Function calling result
  let function_prompt = "";
  if (inputType === TYPE.TOOL_CALL && functionResults && functionResults.length > 0) {
    for (let i = 0; i < functionResults.length; i++) {
      const f = functionResults[i];
      const c = functionCalls[i];
      
      if (c.tyle === "function" && c.function && c.function.name === f.name) {
        // Feed message with function calling result
        messages.push({
          "role": "tool",
          "content": f.message,
          "tool_call_id": c.id,
        });

        function_prompt += f.message;
      }
    }

    // Count tokens
    token_ct["function"] = countToken(model, function_prompt);
  }

  // 2. Vector data store result
  let store_prompt = "";
  if (use_vector && store) {
    console.log("--- vector data store ---");

    // Get store info
    const storeInfo = await getStore(store, user.username);

    // Get settings
    const settings = JSON.parse(storeInfo.settings);
    const corpusId = settings.corpusId;
    const apiKey = settings.apiKey;
    const threshold = settings.threshold;
    const numberOfResults = settings.numberOfResults;

    // Query
    if (!apiKey || !corpusId || !threshold || !numberOfResults) {
      console.log("response: (Store not configured)\n");
    } else {
      console.log("corpus_id: " + corpusId);
      console.log("api_key: " + apiKey);
      console.log("threshold: " + threshold);
      console.log("number_of_results: " + numberOfResults);

      const queryResult = await vectaraQuery(input, corpusId, apiKey, threshold, numberOfResults);
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

          store_prompt += content;
        });
      }
    }

    // Count tokens
    token_ct["store"] = countToken(model, store_prompt);
  }

  // 3. Node AI result
  let node_prompt = "";
  if (use_node_ai && node) {
    console.log("--- node ai ---");

    // Get node info
    const nodeInfo = await getNode(node, user.username);

    // Get settings
    const settings = JSON.parse(nodeInfo.settings);
    const endpoint = settings.endpoint;
    if (!endpoint) {
      console.log("response: (Node not configured)\n");
    } else {
      console.log("endpoint: " + endpoint);

      const queryResult = (await queryNodeAi(input, endpoint)).result;
      if (!queryResult) {
        console.log("response: (no result)\n");
      } else {
        console.log("response: " + JSON.stringify(queryResult, null, 2) + "\n");
        let content = "";
        if (typeof queryResult.result === "string") {
          content = queryResult.result;
        } else {
          content = queryResult.result.text;
        }

        messages.push({
          "role": "system",
          "content": "Reference data: " + content,
        });

        node_prompt += content;
      }
    }

    // Count tokens
    token_ct["node"] = countToken(model, node_prompt);
  }

  // 4. Location info
  let location_prompt = "";
  if (use_location && location) {
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
    const address = await getAddress(lat, lng);
    location_prompt += "User accurate address: " + address + "\n";
    console.log("address: " + address + "\n");

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
    raw_prompt: {
      system: system_prompt,
      role: role_prompt,
      history: chat_history_prompt,
      user_input_file: user_input_file_prompt,
      function: function_prompt,
      store: store_prompt,
      location: location_prompt,
    }
  };
}
