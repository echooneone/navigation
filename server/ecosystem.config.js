module.exports = {
  apps: [{
    name: 'nav-api',
    script: './index.js',
    cwd: '/www/wwwroot/navigation/server',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3721,
      JWT_SECRET: 'CHANGE-THIS-TO-A-RANDOM-LONG-STRING',
      ADMIN_USERNAME: 'admin',
      ADMIN_DEFAULT_PASSWORD: 'change-me-on-first-login',
      CORS_ORIGIN: 'https://nav.yourdomain.com'
    }
  }]
};
