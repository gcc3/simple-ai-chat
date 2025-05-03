import { authenticate } from "utils/authUtils";
import { searchMysqlStore, isInitialized } from "utils/storeUtils";
import { findStore } from "utils/storeUtils.js";
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { store, search } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  try {
    const storeInfo = await findStore(store, username);
    if (!storeInfo) {
      res.status(404).json({
        success: false,
        error: "Store not found.",
      });
      return;
    }
    
    // Get settings
    const settings = JSON.parse(storeInfo.settings);

    // File store
    if (storeInfo.engine === "file") {
      const files = settings.files || [];
      if (files.length === 0) {
        res.status(400).json({
          success: false,
          error: "No files found in the store.",
        });
        return;
      }

      // Initialize an array to store all matches
      const matches = [];

      // Loop through each file and fetch the content
      for (const file of files) {
        try {
          const response = await fetch(file);
          const fileContent = await response.text();

          // Search for the query in the file content
          const lines = fileContent.split("\n");
          const regex = new RegExp(`(${search})`, "gi");

          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              const highlightedLine = lines[i].replace(regex, "**$1**"); // Highlight the matched word
              matches.push({
                file,
                line: i + 1, // Line number (1-based index)
                content: highlightedLine,
              });
            }
          }
        } catch (error) {
          res.status(400).json({
            success: false,
            error: `Error processing file ${file}: ${error.message}`,
          });
          return;
        }
      }

      // Return all matches or a message if no matches were found
      if (matches.length > 0) {
        res.status(200).json({
          success: true,
          message: "Engine: " + storeInfo.engine + "\n"
            + "Search: \"" + search + "\"\n"
            + "Matches count: " + matches.length + "\n"
            + "Matches: " + JSON.stringify(matches, null, 2),
        });
      } else {
        res.status(404).json({
          success: false,
          error: "No matches found in any files.",
        });
      }
    }

    // MySQL store
    if (storeInfo.engine === "mysql") {
      // Check is initialized
      if (!isInitialized(storeInfo.engine, settings)) {
        res.status(400).json({
          success: false,
          error: "Store not initialized. Use `:store init [engine]` to initialize a data store.",
        });
        return;
      }

      const queryResult = await searchMysqlStore(settings, search);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: queryResult.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Engine: " + storeInfo.engine + "\n"
               + "Search: \"" + search + "\"\n"
               + "Query: " + queryResult.query + "\n"
               + "Result: \n" + queryResult.message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: "Invalid engine for search.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
