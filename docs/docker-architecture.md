# Docker Implementation Architecture

## Overview

This document describes how the Docker implementation for actual-flow works.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           docker-entrypoint.sh                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Mode Selection:                                │  │  │
│  │  │  • cron (default)    → Start crond + tail logs │  │  │
│  │  │  • interactive       → Run CLI menu             │  │  │
│  │  │  • sync/import       → Run single sync          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ↓                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Node.js Application                       │  │
│  │  /app/dist/index.js                                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  ConfigManager                                  │  │  │
│  │  │  • Reads CONFIG_PATH env (/data)                │  │  │
│  │  │  • Loads config.json from /data/config.json     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  LunchFlowImporter                              │  │  │
│  │  │  • Interactive mode: show menu & configure      │  │  │
│  │  │  • Import mode: fetch & sync transactions       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ↓                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Persistent Storage                        │  │
│  │  /data/config.json                                    │  │
│  │  • Lunch Flow credentials                             │  │
│  │  • Actual Budget credentials                          │  │
│  │  • Account mappings                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                     Volume Mount
                            │
                            ↓
┌───────────────────────────────────────────────────────────────┐
│                    Host Filesystem                            │
│  ./data/config.json (persisted between container restarts)   │
└───────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Dockerfile
- **Base Image**: node:20-alpine (minimal, secure)
- **Build Process**: 
  1. Install pnpm
  2. Install dependencies (--frozen-lockfile)
  3. Build TypeScript → JavaScript
  4. Create /data directory
  5. Set CONFIG_PATH=/data
  6. Copy and configure entrypoint script

### 2. docker-entrypoint.sh
Entry point script that handles multiple execution modes:

#### Mode: `cron` (default)
```bash
1. Create cron job: "0 2 * * * cd /data && node /app/dist/index.js import"
2. Start crond in background
3. Tail /var/log/actual-flow.log for real-time logs
```

#### Mode: `interactive` or `config`
```bash
1. cd /data
2. exec node /app/dist/index.js (interactive menu)
```

#### Mode: `sync` or `import`
```bash
1. cd /data
2. node /app/dist/index.js import (direct import)
```

### 3. Configuration Flow

```
User runs: docker-compose run --rm actual-flow interactive
    ↓
Container starts → entrypoint.sh receives "interactive"
    ↓
Changes to /data directory
    ↓
Runs: node /app/dist/index.js
    ↓
ConfigManager checks CONFIG_PATH env (/data)
    ↓
Creates or loads /data/config.json
    ↓
User configures via interactive prompts
    ↓
Config saved to /data/config.json
    ↓
Volume mount persists to ./data/config.json on host
```

### 4. Automatic Sync Flow

```
Container running in cron mode
    ↓
Crond executes at 2 AM UTC
    ↓
Runs: cd /data && node /app/dist/index.js import
    ↓
ConfigManager loads /data/config.json
    ↓
LunchFlowImporter.runImport()
    ↓
Fetches transactions from Lunch Flow
    ↓
Imports to Actual Budget
    ↓
Logs output to /var/log/actual-flow.log
    ↓
Visible via: docker logs actual-flow
```

## Volume Mounts

| Container Path | Host Path | Purpose |
|---------------|-----------|---------|
| /data | ./data | Configuration persistence |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| CONFIG_PATH | /data | Where to store config.json |
| TZ | UTC | Timezone for cron scheduling |

## Key Features

1. **Configuration Persistence**: Config survives container restarts
2. **Multi-Mode Operation**: Interactive, manual, and automatic modes
3. **Timezone Support**: Customize cron schedule timezone
4. **Log Access**: Real-time logs via `docker logs`
5. **Manual Triggers**: Run sync anytime with `docker exec`

## Usage Patterns

### First-Time Setup
```bash
docker-compose run --rm actual-flow interactive
docker-compose up -d
```

### Daily Operations
```bash
# View logs
docker logs -f actual-flow

# Manual sync
docker exec actual-flow /usr/local/bin/docker-entrypoint.sh sync
```

### Maintenance
```bash
# Reconfigure
docker-compose run --rm actual-flow interactive

# Restart
docker-compose restart

# Stop
docker-compose down
```

## Security Considerations

- ✅ No credentials in Docker image
- ✅ Config stored in mounted volume only
- ✅ Minimal base image (Alpine)
- ✅ No exposed ports
- ✅ Frozen dependencies (reproducible builds)
- ✅ Standard user permissions

## Extensibility

To customize the cron schedule, modify line 20 in `docker-entrypoint.sh`:

```bash
# Daily at 2 AM (default)
echo "0 2 * * * ..." > /etc/crontabs/root

# Every 6 hours
echo "0 */6 * * * ..." > /etc/crontabs/root

# Twice daily (2 AM and 2 PM)
echo "0 2,14 * * * ..." > /etc/crontabs/root
```

Then rebuild and restart:
```bash
docker-compose build
docker-compose up -d
```
