// Input output type
export const TYPE = {
  NORMAL: "normal",
  TOOL_CALL: "tool_call",
  IMAGE_GEN: "image_gen",
  IMAGE_EDIT: "image_edit",
};

// Status control
export const STATES = { IDLE: "idle", DOING: "doing" };

// Front or back display
export const DISPLAY = { FRONT: "front", BACK: "back" };

// Back display content
export const CONTENT = {
  DOCUMENTATION: "documentation",
  USAGE: "usage",
  PRIVACY: "privacy",
  SETTINGS: "settings",
};

// Fullscreen mode
export const FULLSCREEN = {
  DEFAULT: "default",
  OFF: "off",
  SPLIT: "split"
};

export const PLACEHOLDER = ":help";
export const WAITING = "";
export const REASONING = "Reasoning...";
export const QUERYING = "Querying...";
export const GENERATING = "Generating...";
export const SEARCHING = "Searching...";
