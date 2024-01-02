module.exports = {
  apps : [{
    name: 'simple-ai.io',
    script: 'app.js',
    args: 'run',
    interpreter: '/root/.nvm/versions/node/v21.5.0/bin/node',
    // watch: true,   // restart on file changes
    env: {
      PORT: 3000
    }
  }]
};
