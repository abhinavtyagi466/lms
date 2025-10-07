module.exports = {
  apps: [
    {
      name: 'edutech-backend-dev',
      script: 'server.js',
      watch: true, // Enable watch mode for auto-reload
      ignore_watch: [
        'node_modules',
        'uploads',
        'logs',
        '*.log',
        'tests',
        '.git'
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
    },
    {
      name: 'edutech-backend-prod',
      script: 'server.js',
      watch: false, // Disable watch in production
      instances: 2, // Use cluster mode for better performance
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};

