# Docker Usage Examples

This document provides step-by-step examples for using actual-flow with Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)
- Lunch Flow API key
- Actual Budget server running and accessible

## Example 1: First-Time Setup with Docker Compose

### Step 1: Clone or navigate to the project directory
```bash
cd /path/to/actual-flow
```

### Step 2: Configure the application
Run the interactive configuration:
```bash
docker-compose run --rm actual-flow interactive
```

Follow the prompts to:
1. Enter your Lunch Flow API key
2. Enter your Lunch Flow base URL (or use default)
3. Enter your Actual Budget server URL
4. Enter your budget sync ID
5. Enter your password (if required)
6. Configure account mappings

### Step 3: Verify configuration
The configuration is saved to `./data/config.json`. You can verify it exists:
```bash
ls -la data/
```

### Step 4: Start automatic sync service
```bash
docker-compose up -d
```

Your container is now running and will automatically sync transactions daily at 2 AM UTC.

## Example 2: Running a Manual Sync

### Option A: Using docker exec (if container is running)
```bash
docker exec actual-flow /usr/local/bin/docker-entrypoint.sh sync
```

### Option B: Using docker-compose run (one-time)
```bash
docker-compose run --rm actual-flow import
```

## Example 3: Using Docker without Docker Compose

### Step 1: Build the image
```bash
docker build -t actual-flow .
```

### Step 2: Create data directory
```bash
mkdir -p data
```

### Step 3: Run interactive configuration
```bash
docker run -it --rm -v $(pwd)/data:/data actual-flow interactive
```

### Step 4: Start the service with automatic sync
```bash
docker run -d \
  --name actual-flow \
  -v $(pwd)/data:/data \
  --restart unless-stopped \
  actual-flow
```

### Step 5: Monitor logs
```bash
docker logs -f actual-flow
```

## Example 4: Changing Timezone for Cron

By default, cron runs at 2 AM UTC. To run at 2 AM in your local timezone:

### With Docker Compose
Edit `docker-compose.yml`:
```yaml
environment:
  - TZ=America/New_York
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### With Docker Run
```bash
docker run -d \
  --name actual-flow \
  -e TZ=America/New_York \
  -v $(pwd)/data:/data \
  actual-flow
```

## Example 5: Reconfiguring Credentials

### Option 1: Run interactive mode again
```bash
docker-compose run --rm actual-flow interactive
```

Navigate to "⚙️ Reconfigure credentials" in the menu.

### Option 2: Edit config.json directly
```bash
nano data/config.json
```

Note: Be careful with manual edits. Use the interactive mode for safety.

## Example 6: Viewing Sync Logs

### Real-time log following
```bash
docker logs -f actual-flow
```

### Last 100 lines
```bash
docker logs --tail 100 actual-flow
```

### Since last 1 hour
```bash
docker logs --since 1h actual-flow
```

## Example 7: Stopping and Removing the Container

### Stop the container
```bash
docker-compose down
```

Or with docker:
```bash
docker stop actual-flow
docker rm actual-flow
```

Note: Your configuration in `./data/config.json` is preserved.

## Example 8: Backup and Restore Configuration

### Backup
```bash
cp data/config.json data/config.json.backup
```

### Restore
```bash
cp data/config.json.backup data/config.json
```

## Troubleshooting

### Container exits immediately
Check logs:
```bash
docker logs actual-flow
```

### Configuration not persisting
Ensure the volume mount is correct:
```bash
docker inspect actual-flow | grep -A 10 Mounts
```

### Cron not running
Verify cron is running inside the container:
```bash
docker exec actual-flow ps aux | grep crond
```

### Testing connection inside container
```bash
docker exec -it actual-flow sh
cd /data
node /app/dist/index.js
```

## Advanced: Custom Cron Schedule

To change the cron schedule from daily at 2 AM, you can:

1. Create a custom entrypoint script
2. Or override the cron schedule by creating a custom Dockerfile:

```dockerfile
FROM actual-flow:latest
RUN echo "0 */6 * * * cd /data && node /app/dist/index.js import >> /var/log/actual-flow.log 2>&1" > /etc/crontabs/root
```

This example runs every 6 hours instead of daily.
