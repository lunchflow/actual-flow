# Actual Flow Docker

A Docker container for [Actual Flow](https://github.com/lunchflow/actual-flow) - automatically import bank transactions from [Lunch Flow](https://lunchflow.com) into [Actual Budget](https://actualbudget.com).

## Features

- Scheduled automatic imports via cron
- Interactive mode for initial setup and account mapping
- Supports Actual Budget server password and e2e encryption
- Configurable import schedule
- Persistent configuration storage

## Prerequisites

- Docker and Docker Compose
- A running [Actual Budget](https://actualbudget.com) server
- A [Lunch Flow](https://lunchflow.com) account with API key
- Bank accounts connected in Lunch Flow

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/lunchflow/actual-flow.git
cd actual-flow/docker

# Copy the environment file
cp .env.example .env
```

### 2. Run Interactive Setup

Run the interactive setup to configure your credentials and map bank accounts:

```bash
docker compose run --rm -e ACTUAL_FLOW_MODE=interactive actual-flow
```

This opens an interactive terminal UI where you can:
- Enter your Lunch Flow API key
- Configure your Actual Budget server URL and credentials
- Test connections to both services
- Map your bank accounts to Actual Budget accounts
- Configure sync start dates for each account

All settings are saved to `data/config.json`.

### 3. Start Scheduled Imports

Once configured, start the container for automatic scheduled imports:

```bash
docker compose up -d
```

## Configuration

### Environment Variables

All credentials are configured through the interactive setup and stored in `config.json`.
The `.env` file only contains runtime settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `TZ` | `UTC` | Timezone for cron schedule |
| `ACTUAL_FLOW_CRON` | `0 6 * * *` | Cron schedule for imports |
| `ACTUAL_FLOW_RUN_ON_STARTUP` | `false` | Run import immediately on start |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` | Set to `1` to enforce TLS verification |

### Cron Schedule Examples

Edit `.env` to change the import schedule:

```env
ACTUAL_FLOW_CRON="0 6 * * *"      # Daily at 6:00 AM (default)
ACTUAL_FLOW_CRON="0 */6 * * *"    # Every 6 hours
ACTUAL_FLOW_CRON="0 8,20 * * *"   # Twice daily at 8 AM and 8 PM
ACTUAL_FLOW_CRON="*/30 * * * *"   # Every 30 minutes
```

## Usage

### View Logs

```bash
docker compose logs -f actual-flow
```

### Run Manual Import

```bash
# Using the running container
docker compose exec actual-flow actual-flow import

# Or run a fresh one-time import
docker compose run --rm -e ACTUAL_FLOW_MODE=once actual-flow
```

### Re-run Interactive Setup

To change credentials or remap accounts:

```bash
docker compose run --rm -e ACTUAL_FLOW_MODE=interactive actual-flow
```

### Rebuild After Updates

```bash
docker compose build --no-cache
docker compose up -d
```

## File Structure

```
actual-flow-docker/
├── Dockerfile          # Container image definition
├── entrypoint.sh       # Container startup script
├── docker-compose.yml  # Docker Compose configuration
├── .env.example        # Example environment variables
├── .env                # Your configuration (git-ignored)
├── data/               # Persistent config (created automatically)
│   └── config.json     # Credentials and account mappings
└── README.md           # This file
```

## Troubleshooting

### "Configuration file not found"

You need to run the interactive setup first:

```bash
docker compose run --rm -e ACTUAL_FLOW_MODE=interactive actual-flow
```

### Connection Failed to Actual Budget

1. **Check the URL**: Ensure the server URL is correct and reachable from the container
2. **HTTPS with self-signed certs**: Keep `NODE_TLS_REJECT_UNAUTHORIZED=0` in `.env`
3. **Docker networking**: If Actual Budget is in Docker, ensure both containers are on the same network
4. **Firewall**: Ensure the port is accessible

### Authentication Failed

Run interactive setup again to verify:
1. Server password is correct (if set)
2. Sync ID matches (Settings > Show advanced settings in Actual Budget)
3. Encryption password is correct (if e2e encryption is enabled)

### Reset Configuration

To start fresh:

```bash
rm -f data/config.json
docker compose run --rm -e ACTUAL_FLOW_MODE=interactive actual-flow
```

## Integration with Existing Actual Budget Docker Setup

If you're already running Actual Budget in Docker, add actual-flow to the same network:

```yaml
services:
  actual-flow:
    build: ./actual-flow-docker
    container_name: actual-flow
    networks:
      - your_network
    environment:
      - TZ=${TZ:-UTC}
      - NODE_TLS_REJECT_UNAUTHORIZED=0
      - ACTUAL_FLOW_CRON=${ACTUAL_FLOW_CRON:-0 6 * * *}
      - ACTUAL_FLOW_RUN_ON_STARTUP=false
    volumes:
      - ./actual-flow-data:/app/config
    depends_on:
      - actual-budget
    restart: unless-stopped

networks:
  your_network:
    external: true
```

## License

MIT

## Credits

- [Actual Flow](https://github.com/lunchflow/actual-flow) by Lunch Flow
- [Actual Budget](https://actualbudget.com)
- [Lunch Flow](https://lunchflow.com)
