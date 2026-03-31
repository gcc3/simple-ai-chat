// Input output type
export const TYPE = {
  Normal: "normal",
  ToolCall: "tool_call",
  ImageGen: "image_gen",
  ImageEdit: "image_edit",
};

// Status control
export const STATES = { Idle: "idle", Doing: "doing" };

// Front or back display
export const DISPLAY = { Front: "front", Back: "back" };

// Back display content
export const CONTENT = {
  Documentation: "documentation",
  Usage: "usage",
  Privacy: "privacy",
  Settings: "settings",
};

// Fullscreen mode
export const FULLSCREEN = {
  Default: "default",
  Off: "off",
  Split: "split"
};

export const PLACEHOLDER = ":help";
export const WAITING = "";
export const REASONING = "Reasoning...";
export const QUERYING = "Querying...";
export const GENERATING = "Generating...";
export const SEARCHING = "Searching...";
