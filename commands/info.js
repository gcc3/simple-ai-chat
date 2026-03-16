import { getSetting } from "../utils/settingsUtils.js";

export default async function info(args) {
  return "Session: " + getSetting("session") + "\n" +
         "Server base URL: " + globalThis.serverBaseUrl + "\n" +
         "Network status: " + (globalThis.isOnline ? "online" : "offline") + "\n" +
         "Ollama status: " + (globalThis.isOllamaAvailable ? "connected" : "unavailable") + "\n" +
         "Ollama base URL: " + globalThis.ollamaBaseUrl + "\n" +
         "MCP server status: " + (globalThis.isMCPServerAvailable ? "connected" : "unavailable") + "\n" +
         "MCP server base URL: " + globalThis.mcpServerBaseUrl + "\n" +
         "Model: " + getSetting("model") + "\n" +
         "Model base URL: " + (getSetting("baseUrl") || "___") + "\n" +
         "Functions (key: `functions`): " + (getSetting("functions") || "___") + "\n" +
         "Role (key: `role`): " + (getSetting("role") || "___") + "\n" +
         "Stores (key: `stores`): " + (getSetting("stores") || "___") + "\n" +
         "Node (key: `node`): " + (getSetting("node") || "___") + "\n" +
         "Language (key: `lang`): " + (getSetting("lang") || "default") + "\n" +
         "Author Information: Created by @318yang, Kyoto, 2023" + "\n";
}
