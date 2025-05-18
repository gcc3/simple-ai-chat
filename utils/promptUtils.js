import { loglist } from './logUtils.js';
import { getRolePrompt } from './roleUtils.js';
import { getRole } from './sqliteUtils.js';
import { getAddress } from "utils/googleMapsUtils";
import { fetchImageSize } from "utils/imageUtils";
import { getSystemConfigurations } from "utils/systemUtils.js";
import { findNode, queryNode, checkIsNodeConfigured } from "utils/nodeUtils";
import { findStore, isInitialized, searchMysqlStore } from "utils/storeUtils";
import fetch from 'node-fetch';
import { getLanguageName } from './langUtils.js';
import { TYPE } from '../constants.js';


// System configurations
const sysconf = getSystemConfigurations();

/*
  Generate messages for chatCompletion
  Messages:
  -6. System master message
  -5. Role prompt
  -4. Data store search result
  -3. Node AI result
  -2. Location info
  -1. Chat history
   0. User input
   1. Function calling result

  Callback Functions:
  1. updateStatus: function callback to update status
  2. streamOutput: function callback to stream output from LLM
*/
export async function generateMessages(use_system_role, lang,
                                       user, model, input, inputType, files, images,
                                       session, mem_limit = 7,

                                       // Role, Stores, Node
                                       role, stores, node,
                                       
                                       // Location info
                                       use_location, location,

                                       // Function calling
                                       functionCalls, functionCallingResults,

                                       // Callbacks
                                       updateStatus = null, streamOutput = null) {
  let messages = [];
  let mem = 0;
  let input_images = [];
  let file_content = "";
  let node_input = "";
  let node_output = "";
  let node_output_images = [];

  // Session history
  const sessionLogs = await loglist(session, mem_limit);  // limit the memory length in the chat history
  
  // Preprocess files
  // File input
  let files_text = [];
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

          file_content += "User input file content:\n" + fileContent + "\n\n";
          files_text.push({
            file: files[i],
            text: fileContent,
          });
        } catch (error) {
          const errorMessages = "Error fetching file:" + files[i] + "\n" + error;
          console.error(errorMessages);
          files_text.push({
            file: files[i],
            text: errorMessages,
          });
        }
      }
    }
  }

  // -6. System master message, important
  let system_prompt = "";
  if (use_system_role && sysconf.role_content_system !== "") {
    system_prompt += sysconf.role_content_system + "\n\n";

    // User language
    // lang is the language code, e.g. "en-US"
    if (lang) {
      const langName = getLanguageName(lang);
      if (langName !== "Unknown") {
        system_prompt += "\n\n" + "Must reply with " + langName;
      }
    }

    messages.push({ 
      role: "system",
      content: system_prompt,
    });
  }

  // -5. Role prompt
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
  }

  // -4. Data stores search result
  let stores_prompt = "";
  
  // General store search
  if (stores && user) {
    updateStatus && updateStatus("Data stores searching...");
    console.log("--- data stores search ---");
    console.log("stores: " + stores);

    // Search all active stores
    const activeStores = stores.split(",").filter(s => s !== "");
    for (const store of activeStores) {
      // Get store info
      const storeInfo = await findStore(store, user.username);
      if (storeInfo) {
        const settings = JSON.parse(storeInfo.settings);

        // File store
        if (storeInfo.engine === "file") {
          const files = settings.files || [];
          // Loop through each file and fetch the content
          for (const file of files) {
            try {
              const response = await fetch(file);
              const fileContent = await response.text();

              stores_prompt += "\n\n" + fileContent + "\n\n";
            } catch (error) {
              console.error("Error fetching file:", error);
              console.log("store `" + store + "`: " + "error fetching file: " + file + "\n" + error);
            }
          }
        }

        // MySQL store
        if (storeInfo.engine === "mysql") {
          if (isInitialized(storeInfo.engine, settings)) {
            let queryResult = null;
            let mysqlPrompt = "";

            // Query
            mysqlPrompt += "\nQuery MySQL database\n";
            mysqlPrompt += "Database description: " + (settings.description || "No description") + "\n";
            updateStatus && updateStatus("Start searching...");
            queryResult = await searchMysqlStore(settings, input);

            if (queryResult.success) {
              if (queryResult.query) {
                mysqlPrompt += "Query: " + queryResult.query + "\n";
              }
              mysqlPrompt += "Query result: \n";
              mysqlPrompt += queryResult.message.trim();

              stores_prompt += "\n\n" + mysqlPrompt + "\n\n";
            }
          }
        }
      }
    }

    messages.push({
      "role": "system",
      "content": "Support data:" + stores_prompt,
    })
    console.log("");  // add new line
  }

  // -3. Node AI result
  let node_prompt = "";

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

  if (sysconf.use_node_ai && node) {
    updateStatus && updateStatus("Node AI generating...");
    console.log("--- node ai ---");
    console.log("node: " + node);

    // Get node
    const nodeInfo = await findNode(node, user ? user.username : "root");  // root user's node is public, everyone can use it

    // Verify node
    let isNodeConfigured = false;
    let nodeSettings = null;
    if (nodeInfo) {
      nodeSettings = JSON.parse(nodeInfo.settings);
      isNodeConfigured = checkIsNodeConfigured(nodeSettings)
    }
    
    if (nodeInfo && nodeSettings && isNodeConfigured) {
      node_input = input;

      // Override node_input
      let ar = 1;
      console.log("node_input: " + node_input.replace(/\n/g, " "));

      // Show a message for generting
      updateStatus && updateStatus("Node AI querying, prompt: " + node_input.replace(/\n/g, " "));

      // Start sending keep-alive messages
      const stopKeepAlive = await sendKeepAlive(updateStatus);

      // Prepare the query
      // histories
      let histories = [];
      if (nodeSettings.useHistory) {
        histories = sessionLogs.reverse().map((log) => ({
          input: log.input,
          output: log.output,
        }))
        console.log("histories: " + JSON.stringify(histories));
      } else {
        console.log("histories: disabled.");
      }

      // files
      console.log("files: " + JSON.stringify(files));

      // Query Node AI
      const nodeResponse = await queryNode(node_input, nodeSettings, histories, files_text, streamOutput);

      // Stop sending keep-alive messages
      stopKeepAlive();
      updateStatus && updateStatus("Node AI responsed, result: " + JSON.stringify(nodeResponse));

      if (nodeResponse && nodeResponse.success) {
        let content = "";

        // Format result
        if (typeof nodeResponse.result === "string") {
          content += nodeResponse.result;
          node_output = nodeResponse.result;
        } else if (nodeResponse.result.text || nodeResponse.result.image) {

          // Node AI generated images
          if (nodeResponse.result.images && nodeResponse.result.images.length > 0) {

            node_output = nodeResponse.result.text || "Here it is, a generated image.";
            node_output_images = nodeResponse.result.images;

            // Add aspect ratio to each image
            for (let i = 0; i < node_output_images.length; i++) {
              if (!node_output_images[i].includes("?ar=")) {
                node_output_images[i] += "?ar=" + ar;
              }
            }

            // Pop out the real user input
            // the node input
            messages.pop();

            // Override the user input with images
            const fakeUserInput = "Evaluate this image, within 55 words."
            input = fakeUserInput;
            console.log("Override the user input: " + fakeUserInput);

            // Override the input images
            images = [node_output_images[0]];
            console.log("Override the input images: " + JSON.stringify(images));
          } else {
            content += nodeResponse.result.text;
          }
        }

        if (content) {
          messages.push({
            "role": "system",
            "content": content,
          });
        }
        node_prompt += content;
      }
    } else {
      console.log("Node not found or not configured.");
    }

    // Count tokens
    console.log("response: " + node_output.trim().replace(/\n/g, " "));
    if (node_output_images.length > 0) console.log("response images: " + JSON.stringify(node_output_images));
    console.log("");
  }

  // -2. Location info
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
  }

  // -1. Chat history
  let chat_history_prompt = "";
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
        if (isFound) {
          const message = log.output.slice(2);
          messages.push({ 
            role: "tool",
            content: message,
            tool_call_id: c.id,
          });
        }
      } else {
        // Normal log
        // 1. Input
        // Note: to record the original user input after the function calling the input will add "Q=" as prefix
        // For this log input just ignore and don't add as a message
        if (!log.input.startsWith("Q=")) {
          let content = [];

          // Text input
          if (log.input) {
            content.push({
              type: "text",
              text: log.input
            })
          }

          // Image input
          if (log.images) {
            const images = JSON.parse(log.images);
            if (images.length > 0) {
              images.map(image => {
                content.push({
                  type: "image_url",
                  image_url: {
                    url: image
                  }
                })
              });
            }
          }

          messages.push({ 
            role: "user",
            content: content
          });
        }
        
        // 2. Output
        if (log.output) {
          if (log.output.startsWith("T=")) {
            // Tool call output log
            // The output will add "T=" as prefix
            // AI generated the tool call
            // If it is version model, function calling will be disabled as it is not supported
            messages.push({ 
              role: "assistant",
              tool_calls: JSON.parse(log.output.slice(2)),
            });
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
        
        // File input (extracted text)
        if (files_text && files_text.length > 0) {
          for (let i = 0; i < files_text.length; i++) {
            if (files_text[i].text !== "") {
              c.push({
                type: "text",
                text: "File content: " + files_text[i].text,
              });
              user_input_file_prompt += "File content: " + files_text[i].text;
            }
          }
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
                type: "image_url",
                image_url: {
                  url: images[i]
                }
              });
              input_images.push(images[i]);
            }
          }
        }
        return c;
      })()  // Immediately-invoked function expression (IIFE)
    });
  }

  // 1. Function calling result
  // The latest function calling result, not the history
  let function_prompt = "";
  if (inputType === TYPE.TOOL_CALL && functionCallingResults && functionCallingResults.length > 0) {
    for (let i = 0; i < functionCallingResults.length; i++) {
      const f = functionCallingResults[i];
      const c = functionCalls[i];
      
      // Structure with OpenAI function calling format
      // {
      //    role: "tool",
      //    content: "The time is 3:18 PM",
      //    tool_call_id: "call_Ky031WX9JPGVvZn9euHNqdun",
      // }
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
  }

  return {
    messages,
    mem,
    input_images,
    file_content,
    node_input,
    node_output,
    node_output_images,
    raw_prompt: {
      system: system_prompt,
      role: role_prompt,
      history: chat_history_prompt,
      user_input_file: user_input_file_prompt,
      function: function_prompt,
      stores: stores_prompt,
      node: node_prompt,
      location: location_prompt,
    }
  };
}
