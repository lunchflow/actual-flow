<p align="center">
	<h1 align="center"><b>Lunch Flow 🤝 Actual Budget</b></h1>
<p align="center">
    Connect multiple open banking providers to your Actual Budget server.
    <br />
    <br />
    <a href="https://discord.gg/TJn5mMV4jZ">Discord</a>
    ·
    <a href="https://lunchflow.app">Website</a>
	·
    <a href="https://lunchflow.app/feedback">Feedback</a>
  </p>
</p>

## About Lunch Flow

[Lunch Flow](https:lunchflow.app) is a tool that allows you to connect your banks globally to the tools you love. We currently support multiple open banking providers (GoCardless, Finicity, MX, Finverse, and more ...).

## Demo

![Demo](./docs/demo.gif)

## Features

- 🔗 **Easy Setup**: Simple configuration process for both Lunch Flow and Actual Budget connections
- 📋 **Account Mapping**: Interactive terminal UI to map Lunch Flow accounts to Actual Budget accounts
- 📊 **Transaction Import**: Import transactions with proper mapping and deduplication
- 📅 **Sync Start Dates**: Configure per-account sync start dates to control import scope
- 🔍 **Connection Testing**: Test and verify connections to both services
- 📱 **Terminal UI**: Beautiful, interactive command-line interface
- 🚀 **Direct Import Command**: Run imports directly from command line for automation
- 🔄 **Deduplication**: Prevents importing duplicate transactions

## Installation

A simple command to install!

```
npx @lunchflow/actual-flow
```

or using pnpm

```
pnpm dlx @lunchflow/actual-flow
```

## Configuration

The tool will guide you through the initial setup process:

1. **Lunch Flow API Key**: Enter your Lunch Flow API key
2. **Lunch Flow Base URL**: Enter the API base URL (default: https://api.lunchflow.com)
3. **Actual Budget Server URL**: Enter your Actual Budget server URL (default: http://localhost:5007)
4. **Actual Budget Budget Sync ID**: Enter your budget sync ID
5. **Actual Budget Password**: Enter password if required

Configuration is saved to `config.json` in the project directory.

## Usage

### Command Line Interface

The tool supports both interactive and non-interactive modes:

```bash
# Interactive mode (default)
actual-flow

# Direct import (non-interactive)
actual-flow import

# Show help
actual-flow help
```

### Main Menu (Interactive Mode)

The tool provides an interactive menu with the following options:

- **🔗 Test connections**: Verify connections to both Lunch Flow and Actual Budget
- **📋 List available budgets**: Show all budgets available on your Actual Budget server
- **📋 Configure account mappings**: Map Lunch Flow accounts to Actual Budget accounts
- **📊 Show current mappings**: Display currently configured account mappings
- **📥 Import transactions**: Import transactions for a selected date range
- **⚙️ Reconfigure credentials**: Update API credentials
- **❌ Exit**: Exit the application

### Account Mapping

When configuring account mappings, you'll see:

1. All available Lunch Flow accounts
2. All available Actual Budget accounts
3. Interactive selection to map each Lunch Flow account to an Actual Budget account
4. **Optional sync start date** for each mapping (YYYY-MM-DD format)
5. Option to skip accounts that don't need mapping

#### Sync Start Dates

You can configure a sync start date for each account mapping to control which transactions are imported:
- Only transactions on or after the specified date will be imported
- Leave empty to import all available transactions
- Useful for limiting historical data or starting fresh with specific accounts

### Transaction Import

#### Interactive Mode
1. Review a preview of transactions to be imported
2. Confirm the import
3. Monitor progress with real-time feedback
4. Automatic deduplication prevents importing existing transactions

#### Non-Interactive Mode (`actual-flow import`)
1. Automatically imports transactions without confirmation prompts
2. Perfect for automation, cron jobs, or CI/CD pipelines
3. Shows transaction preview and processing summary
4. Respects configured sync start dates for each account

## Automation Examples

### Cron Job
```bash
# Run import every day at 2 AM
0 2 * * * npx @lunchflow/actual-flow import
```

## Docker Deployment

The application can be run in a Docker container with automatic scheduling support.

### Prerequisites

- Docker and Docker Compose installed
- Internet connection during build (to download dependencies)

### Quick Start with Docker Compose

1. **Build the image (first time only):**
   ```bash
   docker-compose build
   ```
   
   > **Note**: If the build fails with network errors, retry the build command. The issue is typically transient network connectivity during dependency installation.

2. **Initial Setup - Configure the application interactively:**
   ```bash
   docker-compose run --rm actual-flow interactive
   ```
   This will start the interactive CLI where you can:
   - Configure Lunch Flow and Actual Budget credentials
   - Map accounts
   - Test connections

3. **Start the automatic sync service:**
   ```bash
   docker-compose up -d
   ```
   This runs the container with automatic daily sync at 2 AM UTC.

4. **Run manual sync anytime:**
   ```bash
   docker exec actual-flow /usr/local/bin/docker-entrypoint.sh sync
   ```

5. **View logs:**
   ```bash
   docker logs -f actual-flow
   ```

### Docker Run Commands

If you prefer not to use docker-compose:

1. **Build the image:**
   ```bash
   docker build -t actual-flow .
   ```
   
   > **Troubleshooting**: If you encounter network errors during build, this is usually a temporary issue with npm/pnpm registry connectivity. Simply retry the build command. You can also try:
   > ```bash
   > # Build with no cache to start fresh
   > docker build --no-cache -t actual-flow .
   > ```

2. **Interactive configuration:**
   ```bash
   docker run -it --rm -v $(pwd)/data:/data actual-flow interactive
   ```

3. **Run with automatic daily sync:**
   ```bash
   docker run -d --name actual-flow -v $(pwd)/data:/data actual-flow
   ```

4. **Manual sync:**
   ```bash
   docker exec actual-flow /usr/local/bin/docker-entrypoint.sh sync
   ```

5. **Direct import (one-time):**
   ```bash
   docker run --rm -v $(pwd)/data:/data actual-flow import
   ```

### Configuration Persistence

Configuration is stored in `config.json` and persists in the mounted volume:
- Docker Compose: `./data` directory in your project
- Docker Run: Specify with `-v` flag

### Timezone Configuration

By default, the cron runs at 2 AM UTC. To change the timezone, set the `TZ` environment variable:

```yaml
environment:
  - TZ=America/New_York
```

Or with docker run:
```bash
docker run -d -e TZ=America/New_York -v $(pwd)/data:/data actual-flow
```

### Available Commands

The Docker entrypoint supports the following commands:
- `cron` (default) - Runs the container with automatic daily sync
- `interactive` or `config` - Opens interactive CLI for configuration
- `sync` - Runs a manual sync
- `import` - Runs direct import (same as `sync`)

---

Made with ❤️ for the Actual Budget community
