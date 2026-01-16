import multiprocessing
import os

# Server socket
bind = "0.0.0.0:7000"
backlog = 2048

# Worker processes - Start with fewer workers, scale based on load
# Use environment variable or default to 2-4 workers
workers = int(os.getenv("WORKER_COUNT", "2"))
max_workers = multiprocessing.cpu_count() * 2 + 1

# Worker class
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# Graceful timeout for worker restart
graceful_timeout = 30

# Max requests per worker before restart (helps with memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Preload app for faster worker spawning
preload_app = False

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "audio-transcription-service"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Worker lifecycle hooks for dynamic scaling
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info(f"Starting with {workers} workers (max: {max_workers})")

def when_ready(server):
    """Called just after the server is started."""
    server.log.info("Server is ready. Accepting connections.")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    server.log.info("Reloading workers...")

# SSL (if needed)
# keyfile = None
# certfile = None
