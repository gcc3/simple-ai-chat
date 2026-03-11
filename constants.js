// Input output type
export const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1,
  IMAGE_GEN: 2,
  IMAGE_EDIT: 3,
};

// Status control
export const STATES = { IDLE: 0, DOING: 1 };

// Front or back display
export const DISPLAY = { FRONT: 0, BACK: 1 };

// Back display content
export const CONTENT = {
  DOCUMENTATION: 0,
  USAGE: 1,
  PRIVACY: 2,
  SETTINGS: 3,
};

export const PLACEHOLDER = ":help";

export const WAITING = "Waiting...";
export const REASONING = "Reasoning...";
export const QUERYING = "Querying...";
export const GENERATING = "Generating...";
export const SEARCHING = "Searching...";
