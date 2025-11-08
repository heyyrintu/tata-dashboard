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
      env_file: '.env',
      error_file: '/var/log/pm2/tata-backend-error.log',
      out_file: '/var/log/pm2/tata-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'dist']
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
      env_file: '.env',
      error_file: '/var/log/pm2/tata-email-error.log',
      out_file: '/var/log/pm2/tata-email-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '200M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'dist']
    }
  ]
};

