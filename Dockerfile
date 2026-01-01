# Use Node.js LTS as base image
FROM node:20-alpine

# Install busybox for cron support (crond is included in busybox)
# No additional packages needed as alpine already includes busybox with crond

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

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
