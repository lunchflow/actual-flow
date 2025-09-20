<p align="center">
	<h1 align="center"><b>Lunch Flow 🤝 Actual Budget</b></h1>
<p align="center">
    Connect multiple open banking providers to your Actual Budget server.
    <br />
    <br />
    <a href="https://discord.gg/TJn5mMV4jZ">Discord</a>
    ·
    <a href="https://lunchflow.app">Website</a>
  </p>
</p>

## About Lunch Flow

[Lunch Flow](https:lunchflow.app) is a tool that allows you to connect your banks globally to the tools you love. We currently support multiple open banking providers (GoCardless, Finicity, MX, SimpleFin, Finverse, and more ...).

## Demo

See the importer in action.

[![asciicast](https://asciinema.org/a/gGd65kHnllxQNIk7umbonU324.svg)](https://asciinema.org/a/gGd65kHnllxQNIk7umbonU324)

## Features

- 🔗 **Easy Setup**: Simple configuration process for both Lunch Flow and Actual Budget connections
- 📋 **Account Mapping**: Interactive terminal UI to map Lunch Flow accounts to Actual Budget accounts
- 📊 **Transaction Import**: Import transactions with proper mapping and deduplication
- 🎯 **Date Range Selection**: Choose specific date ranges for transaction import
- 🔍 **Connection Testing**: Test and verify connections to both services
- 📱 **Terminal UI**: Beautiful, interactive command-line interface
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

### Main Menu

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
4. Option to skip accounts that don't need mapping

### Transaction Import

1. Review a preview of transactions to be imported
2. Confirm the import
3. Monitor progress with real-time feedback
4. Automatic deduplication prevents importing existing transactions

---

Made with ❤️ for the Actual Budget community
