# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build the Project
```bash
pnpm run build
```

### 3. Run the Importer
```bash
pnpm start
```

## 📋 First-Time Setup

When you run the tool for the first time, it will guide you through:

1. **Lunch Flow API Setup**
   - Enter your Lunch Flow API key
   - Enter the API base URL (default: https://api.lunchflow.com)

2. **Actual Budget Setup**
   - Enter your Actual Budget server URL (default: http://localhost:5007)
   - Enter your budget ID
   - Enter password if required

3. **Account Mapping**
   - Map each Lunch Flow account to an Actual Budget account
   - Skip accounts you don't want to sync

## 🔄 Daily Usage

1. **Test Connections**: Verify both services are accessible
2. **Import Transactions**: Select date range and import
3. **Review Results**: See how many transactions were imported

## 🛠️ Development Mode

For development, use:
```bash
pnpm run dev
```

This runs TypeScript directly without building.

## 📁 Configuration

Your settings are saved in `config.json`. You can:
- Edit it manually
- Use the "Reconfigure credentials" option in the menu
- Use environment variables (see `env.example`)

## ❓ Need Help?

- Check the main README.md for detailed documentation
- Look at the troubleshooting section
- Create an issue if you find a bug

---

**Happy importing! 🎉**
