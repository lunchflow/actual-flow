#!/bin/bash
set -e

CONFIG_FILE="/app/config/config.json"
CRON_SCHEDULE="${ACTUAL_FLOW_CRON:-0 6 * * *}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if config exists
check_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Configuration file not found: $CONFIG_FILE"
        echo ""
        echo "Please run interactive setup first to configure credentials and map accounts:"
        echo ""
        echo "  docker compose run --rm -e ACTUAL_FLOW_MODE=interactive actual-flow"
        echo ""
        exit 1
    fi
}

# Run import
run_import() {
    log_info "Starting transaction import..."
    cd /app/config

    if actual-flow import; then
        log_info "Transaction import completed successfully"
    else
        log_error "Transaction import failed"
        return 1
    fi
}

# Main logic
log_info "Actual Flow Importer starting..."

# Interactive mode - always allowed, used for initial setup
if [ "$ACTUAL_FLOW_MODE" = "interactive" ]; then
    log_info "Running in interactive mode..."
    cd /app/config
    exec actual-flow
fi

# For non-interactive modes, config must exist
check_config

# Single run mode
if [ "$ACTUAL_FLOW_MODE" = "once" ]; then
    log_info "Running in single-run mode..."
    run_import
    exit $?
fi

# Default: scheduled mode
log_info "Running in scheduled mode..."
log_info "Cron schedule: $CRON_SCHEDULE"

# Run import immediately on startup if configured
if [ "$ACTUAL_FLOW_RUN_ON_STARTUP" = "true" ]; then
    log_info "Running initial import on startup..."
    run_import || log_warn "Initial import failed, will retry on schedule"
fi

# Create cron job
log_info "Setting up cron schedule: $CRON_SCHEDULE"

# Write cron job
echo "$CRON_SCHEDULE cd /app/config && actual-flow import >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

# Start cron in foreground
log_info "Starting cron daemon..."
exec crond -f -l 2
