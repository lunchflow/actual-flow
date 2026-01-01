# Use Node.js LTS as base image
FROM node:20-alpine

# Install busybox for cron support (crond is included in busybox)
# No additional packages needed as alpine already includes busybox with crond

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy source code (needed before install due to prepare script)
COPY . .

# Enable corepack (includes pnpm) and install dependencies
RUN corepack enable && \
    pnpm install --frozen-lockfile

# Build the application
RUN pnpm run build

# Create directory for config persistence
RUN mkdir -p /data

# Set environment to use /data for config
ENV CONFIG_PATH=/data

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Default to running the cron service
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["cron"]
