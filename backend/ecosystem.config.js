// PM2 ecosystem — gestiona el proceso del backend Node.js
// Ubicación en servidor: /var/www/cecolivenc/repo/backend/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'cecolivenc-backend',
      script: 'index.js',
      cwd: '/var/www/cecolivenc/repo/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logs
      out_file: '/var/log/cecolivenc/out.log',
      error_file: '/var/log/cecolivenc/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
