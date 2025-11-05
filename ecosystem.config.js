module.exports = {
  apps: [
    {
      name: 'tata-dashboard-backend',
      cwd: '/var/www/tata-dashboard/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/tata-backend-error.log',
      out_file: '/var/log/pm2/tata-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'tata-dashboard-email-service',
      cwd: '/var/www/tata-dashboard/backend',
      script: 'dist/services/emailPollingService.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/tata-email-error.log',
      out_file: '/var/log/pm2/tata-email-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '200M'
    }
  ]
};

