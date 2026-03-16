import { getSetting } from "../utils/settingsUtils.js";

export default async function info(args) {
  return "Session: " + getSetting("session") + "\n" +
         "Server base URL: " + globalThis.serverBaseUrl + "\n" +
         "Network status: " + (globalThis.isOnline ? "online" : "offline") + "\n" +
         "Model base URL: " + (getSetting("baseUrl") || "___") + "\n" +
         "Model: " + getSetting("model") + "\n" +
         "Ollama base URL: " + globalThis.ollamaBaseUrl + "\n" +
         "Ollama status: " + (globalThis.isOllamaAvailable ? "connected" : "unavailable") + "\n" +
         "MCP server base URL: " + globalThis.mcpServerBaseUrl + "\n" +
         "MCP server status: " + (globalThis.isMCPServerAvailable ? "connected" : "unavailable") + "\n" +
         "Functions: " + (getSetting("functions") || "___") + "\n" +
         "Role: " + (getSetting("role") || "___") + "\n" +
         "Stores: " + (getSetting("stores") || "___") + "\n" +
         "Node: " + (getSetting("node") || "___") + "\n" +
         "Language: " + (getSetting("lang") || "default") + "\n";
}
