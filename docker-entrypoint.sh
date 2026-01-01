#!/bin/sh
set -e

# Change to /data directory where config will be stored
cd /data

# Function to run the sync
run_sync() {
    echo "$(date): Running sync..." >> /var/log/actual-flow.log
    node /app/dist/index.js import >> /var/log/actual-flow.log 2>&1
    echo "$(date): Sync completed" >> /var/log/actual-flow.log
}

# Handle different commands
case "$1" in
    cron)
        echo "Starting actual-flow with cron (automatic sync every day at 2 AM)..."
        
        # Create cron job that runs daily at 2 AM
        echo "0 2 * * * cd /data && node /app/dist/index.js import >> /var/log/actual-flow.log 2>&1" > /etc/crontabs/root
        
        # Create log file
        touch /var/log/actual-flow.log
        
        # Start crond in foreground
        echo "Cron job configured. Container will keep running and sync daily at 2 AM UTC."
        echo "To view logs: docker logs <container-name>"
        echo "To run manual sync: docker exec <container-name> /usr/local/bin/docker-entrypoint.sh sync"
        
        # Tail the log file and run crond
        crond -f -l 2 &
        tail -f /var/log/actual-flow.log
        ;;
        
    sync)
        echo "Running manual sync..."
        run_sync
        ;;
        
    interactive|config)
        echo "Starting interactive configuration mode..."
        cd /data
        exec node /app/dist/index.js
        ;;
        
    import)
        echo "Running direct import..."
        cd /data
        exec node /app/dist/index.js import
        ;;
        
    *)
        # Pass through any other command
        cd /data
        exec "$@"
        ;;
esac
