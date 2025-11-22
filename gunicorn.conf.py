# gunicorn.conf.py
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
backlog = 2048

# Worker processes
workers = 2  # Reduced from default for better resource usage
worker_class = 'sync'
worker_connections = 1000
timeout = 300  # 5 minutes - enough for cron jobs processing multiple emails
graceful_timeout = 30
keepalive = 5

# Restart workers after this many requests to prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = 'email-service'

# Preload app for faster worker spawning
preload_app = False  # Set to False to avoid Firebase timeout on startup