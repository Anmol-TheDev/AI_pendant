#!/bin/bash

# Script to dynamically scale Gunicorn workers based on load
# Usage: ./scale_workers.sh [min_workers] [max_workers]

MIN_WORKERS=${1:-2}
MAX_WORKERS=${2:-8}
CHECK_INTERVAL=30  # seconds

echo "Starting worker scaling monitor..."
echo "Min workers: $MIN_WORKERS"
echo "Max workers: $MAX_WORKERS"
echo "Check interval: ${CHECK_INTERVAL}s"

# Get Gunicorn master PID
get_master_pid() {
    pgrep -f "gunicorn.*audio-transcription-service" | head -1
}

# Count current workers
count_workers() {
    local master_pid=$1
    pgrep -P $master_pid | wc -l
}

# Get CPU usage
get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}'
}

# Scale up workers
scale_up() {
    local master_pid=$1
    echo "$(date): High load detected. Scaling up workers..."
    kill -TTIN $master_pid
}

# Scale down workers
scale_down() {
    local master_pid=$1
    echo "$(date): Low load detected. Scaling down workers..."
    kill -TTOU $master_pid
}

# Main monitoring loop
while true; do
    MASTER_PID=$(get_master_pid)
    
    if [ -z "$MASTER_PID" ]; then
        echo "$(date): Gunicorn not running. Exiting..."
        exit 1
    fi
    
    CURRENT_WORKERS=$(coun