// Use `pm2 start ecosystem.config.js` to start the app
module.exports = {
  apps : [{
    name: 'simple-ai.io',
    script: 'npm',
    args: 'start',
    interpreter: '/root/.nvm/versions/node/v21.5.0/bin/node',
    // watch: true,   // restart on file changes
    env: {
      PORT: 3000,
      NODE_OPTIONS: '--max-http-header-size=65536',
    }
  }]
};
