FROM node:20-alpine

LABEL maintainer="github.com/lunchflow"
LABEL description="Actual Flow - Import bank transactions to Actual Budget via Lunch Flow"
LABEL org.opencontainers.image.source="https://github.com/lunchflow/actual-flow"

# Install dependencies
RUN apk add --no-cache bash curl tini

# Create app directory
WORKDIR /app

# Install actual-flow globally
RUN npm install -g @lunchflow/actual-flow

# Create directory for config
RUN mkdir -p /app/config

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/entrypoint.sh"]
