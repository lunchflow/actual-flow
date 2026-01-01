# Docker Quick Reference

Quick reference for common actual-flow Docker commands.

## First Time Setup

```bash
# 1. Configure using interactive CLI
docker-compose run --rm actual-flow interactive

# 2. Start automatic sync service
docker-compose up -d
```

## Daily Operations

```bash
# Run manual sync
docker exec actual-flow /usr/local/bin/docker-entrypoint.sh sync

# View logs
docker logs -f actual-flow

# Check if container is running
docker ps | grep actual-flow

# Stop service
docker-compose down

# Restart service
docker-compose restart
```

## Configuration

```bash
# Reconfigure credentials
docker-compose run --rm actual-flow interactive
# Then select "⚙️ Reconfigure credentials" from menu

# View current config (backup first!)
cat data/config.json

# Backup config
cp data/config.json data/config.json.backup
```

## Troubleshooting

```bash
# View recent logs
docker logs --tail 50 actual-flow

# Check container status
docker ps -a | grep actual-flow

# Access container shell
docker exec -it actual-flow sh

# Rebuild container
docker-compose build --no-cache
docker-compose up -d
```

## Schedule Customization

The default schedule is daily at 2 AM UTC.

To change timezone, add to `docker-compose.yml`:
```yaml
environment:
  - TZ=America/New_York  # or your timezone
```

To change cron schedule, edit `docker-entrypoint.sh` line 20:
```bash
# Current: 0 2 * * * (daily at 2 AM)
# Every 6 hours: 0 */6 * * *
# Every hour: 0 * * * *
# Twice daily (2 AM and 2 PM): 0 2,14 * * *
```

## Migration from Non-Docker

If you were running actual-flow without Docker:

```bash
# 1. Copy your existing config
cp config.json data/config.json

# 2. Start with Docker
docker-compose up -d
```

Your existing configuration will be used automatically.
