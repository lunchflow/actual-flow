# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Budget directory does not exist" Error

**Problem**: The script can't find the budget with the ID you provided.

**Solutions**:
1. **Use the "List available budgets" option** in the main menu to see all available budgets
2. **Check your budget sync ID** - it should be the part after `/budget/` in your Actual Budget URL
3. **Make sure your Actual Budget server is running**
4. **Verify you're using the correct server URL**

**How to find your budget sync ID**:
- Open Actual Budget in your browser
- Go to Settings → Show advanced settings
- Look for "Sync ID" - that's your budget sync ID
- Or check the URL: `http://localhost:5007/budget/your-sync-id-here`
- The sync ID is everything after `/budget/`

### 2. "Cannot connect to Actual Budget server" Error

**Problem**: The script can't reach your Actual Budget server.

**Solutions**:
1. **Check if Actual Budget is running**:
   ```bash
   # If using Docker
   docker ps | grep actual
   
   # If using npm
   ps aux | grep actual
   ```

2. **Verify the server URL**:
   - Default: `http://localhost:5007`
   - Check if you're using a different port
   - Make sure there's no firewall blocking the connection

3. **Check if you need a password**:
   - Some Actual Budget setups require a password
   - Enter it when prompted during configuration

### 3. "No Lunch Flow accounts found" Error

**Problem**: The script can't fetch accounts from Lunch Flow.

**Solutions**:
1. **Verify your API key**:
   - Check that it's correct and active
   - Make sure it has the right permissions

2. **Check the API base URL**:
   - Default: `https://api.lunchflow.com`
   - Verify this is the correct endpoint for your Lunch Flow instance

3. **Test the API manually**:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.lunchflow.com/accounts
   ```

### 4. "No Actual Budget accounts found" Error

**Problem**: The script can't fetch accounts from Actual Budget.

**Solutions**:
1. **Make sure you have accounts in Actual Budget**:
   - Open Actual Budget in your browser
   - Check that you have at least one account created

2. **Verify your budget sync ID**:
   - Use the "List available budgets" option to confirm

3. **Check your connection**:
   - Use "Test connections" to verify everything is working

### 5. "No transactions could be mapped" Error

**Problem**: Transactions exist but can't be mapped to Actual Budget accounts.

**Solutions**:
1. **Configure account mappings**:
   - Use the "Configure account mappings" option
   - Map each Lunch Flow account to an Actual Budget account

2. **Check date range**:
   - Make sure you're selecting a date range that has transactions
   - Try a wider date range

### 6. Import Issues

**Problem**: Transactions aren't importing correctly.

**Solutions**:
1. **Check for duplicates**:
   - The script automatically skips duplicate transactions
   - This is normal behavior

2. **Verify account mappings**:
   - Make sure all Lunch Flow accounts are mapped
   - Check that the mappings are correct

3. **Check transaction format**:
   - Make sure Lunch Flow transactions have the expected format
   - Verify dates are in YYYY-MM-DD format

## Debug Mode

Run the script with debug logging to see more details:

```bash
DEBUG=* pnpm start
```

## Getting Help

1. **Check the logs**: Look for error messages in the terminal output
2. **Test connections**: Use the "Test connections" option first
3. **List budgets**: Use "List available budgets" to verify your setup
4. **Reconfigure**: Use "Reconfigure credentials" if something changed

## Configuration File

Your settings are saved in `config.json`. You can:
- Edit it manually if needed
- Delete it to start fresh
- Check it for any obvious issues

Example config structure:
```json
{
  "lunchFlow": {
    "apiKey": "your-api-key",
    "baseUrl": "https://api.lunchflow.com"
  },
  "actualBudget": {
    "serverUrl": "http://localhost:5007",
    "budgetSyncId": "your-budget-sync-id",
    "password": ""
  },
  "accountMappings": []
}
```
