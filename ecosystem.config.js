module.exports = {
  apps: [{
    name: 'personality-test-app',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    }
  }]
};
