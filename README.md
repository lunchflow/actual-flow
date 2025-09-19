# Lunch Flow → Actual Budget Importer

A TypeScript tool that imports transactions from Lunch Flow to Actual Budget with an intuitive terminal UI for configuration and account mapping.

## Features

- 🔗 **Easy Setup**: Simple configuration process for both Lunch Flow and Actual Budget connections
- 📋 **Account Mapping**: Interactive terminal UI to map Lunch Flow accounts to Actual Budget accounts
- 📊 **Transaction Import**: Import transactions with proper mapping and deduplication
- 🎯 **Date Range Selection**: Choose specific date ranges for transaction import
- 🔍 **Connection Testing**: Test and verify connections to both services
- 📱 **Terminal UI**: Beautiful, interactive command-line interface
- 🔄 **Deduplication**: Prevents importing duplicate transactions

## Installation

### Prerequisites

- Node.js 16+ 
- TypeScript
- Lunch Flow API access
- Actual Budget instance

### Quick Install

```bash
# Clone or download this repository
git clone <repository-url>
cd lunch-flow-actual-importer

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run the importer
pnpm start
```

### Development Mode

```bash
# Run in development mode (no build required)
pnpm run dev
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

1. Select a date range for import
2. Review a preview of transactions to be imported
3. Confirm the import
4. Monitor progress with real-time feedback
5. Automatic deduplication prevents importing existing transactions

## API Requirements

### Lunch Flow API

The tool expects the following Lunch Flow API endpoints:

- `GET /accounts` - List accounts
- `GET /transactions` - List transactions with optional filters

Expected response format:
```json
{
  "accounts": [
    {
      "id": "account_id",
      "name": "Account Name",
      "type": "checking",
      "balance": 1000.00,
      "currency": "USD"
    }
  ]
}
```

### Actual Budget API

Uses the official `@actual-app/api` package for Actual Budget integration. The API works by:

1. **Connecting to your Actual Budget server** - Downloads budget data to local cache
2. **Using proper amount conversion** - Converts between decimal amounts (123.45) and integer format (12345) that Actual uses internally
3. **Batch transaction import** - Uses `addTransactions` for efficient bulk imports
4. **Local data caching** - Stores budget data in `./actual-data/` directory for faster access

For more details, see the [Actual Budget API documentation](https://actualbudget.org/docs/api/).

## Development

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── importer.ts             # Main importer class
├── lunch-flow-client.ts    # Lunch Flow API client
├── actual-budget-client.ts # Actual Budget API client
├── transaction-mapper.ts   # Transaction mapping logic
├── config-manager.ts       # Configuration management
├── ui.ts                   # Terminal UI components
└── types.ts                # TypeScript type definitions
```

### Building

```bash
# Development mode
pnpm run dev

# Build for production
pnpm run build

# Run built version
pnpm start

# Clean build artifacts
pnpm run clean
```

## Troubleshooting

### Common Issues

1. **Connection Failed**: Verify your API credentials and network connectivity
2. **No Accounts Found**: Ensure your Lunch Flow account has accounts and your Actual Budget budget is properly set up
3. **Import Failed**: Check that account mappings are configured and transactions are within the selected date range

### Debug Mode

Run with debug logging:

```bash
DEBUG=* pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the GitHub issues
3. Create a new issue with detailed information

---

Made with ❤️ for the Actual Budget community
