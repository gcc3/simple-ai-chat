const fs = require("fs");
const path = require("path");

function readEnv() {
  try {
    return fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  } catch {
    return "";
  }
}

function getEnvVar(key, defaultValue) {
  const match = readEnv().match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : defaultValue;
}

const PORT = getEnvVar("PORT", "3000");
const PM2_NAME = getEnvVar("PM2_NAME");

module.exports = {
  apps: [
    {
      name: PM2_NAME || 'simple-ai.io',
      script: 'npm',
      args: 'start',
      interpreter: '/root/.nvm/versions/node/v21.5.0/bin/node',
      time: true,  // show timestamp in logs
      // watch: true,   // restart on file changes
      env: {
        PORT: PORT,
        NODE_OPTIONS: '--max-http-header-size=512000',
      },
    },
  ],
};
