import { LunchFlowClient } from './lunch-flow-client';
import { ActualBudgetClient } from './actual-budget-client';
import { TransactionMapper } from './transaction-mapper';
import { ConfigManager } from './config-manager';
import { TerminalUI } from './ui';
import { DuplicateTransactionDetector } from './duplicate-detector';
import { Config, AccountMapping, ConnectionStatus, LunchFlowTransaction } from './types';
import chalk from 'chalk';
import Table from 'cli-table3';

export class LunchFlowImporter {
  private lfClient: LunchFlowClient;
  private abClient: ActualBudgetClient;
  private configManager: ConfigManager;
  private ui: TerminalUI;
  private config: Config | null = null;

  constructor() {
    this.configManager = new ConfigManager();
    this.ui = new TerminalUI();
    this.config = this.configManager.loadConfig();
    
    // Initialize clients with default values, will be updated when config is loaded
    this.lfClient = new LunchFlowClient('', '');
    this.abClient = new ActualBudgetClient('', '', '');
  }

  async initialize(): Promise<void> {
    await this.ui.showWelcome();

    if (!this.config || !this.configManager.isConfigured()) {
      console.log('No configuration found or incomplete. Let\'s set it up!\n');
      await this.setupConfiguration();
    } else {
      this.updateClients();
      this.ui.showInfo('Configuration loaded successfully');
    }
  }

  private async setupConfiguration(): Promise<void> {
    const lfCreds = await this.ui.getLunchFlowCredentials();
    const abCreds = await this.ui.getActualBudgetCredentials();

    this.config = {
      lunchFlow: lfCreds,
      actualBudget: abCreds,
      accountMappings: [],
    };

    this.configManager.saveConfig(this.config);
    this.updateClients();
    this.ui.showSuccess('Configuration saved successfully');
  }

  private updateClients(): void {
    if (this.config) {
      this.lfClient = new LunchFlowClient(
        this.config.lunchFlow.apiKey,
        this.config.lunchFlow.baseUrl
      );
      this.abClient = new ActualBudgetClient(
        this.config.actualBudget.serverUrl,
        this.config.actualBudget.budgetSyncId,
        this.config.actualBudget.password,
        this.config.actualBudget.encryptionPassword
      );
    }
  }

  async testConnections(): Promise<ConnectionStatus> {
    const spinner = this.ui.showSpinner('Testing connections...');
    
    try {
      const [lfConnected, abConnected] = await Promise.all([
        this.lfClient.testConnection(),
        this.abClient.testConnection(),
      ]);

      spinner.stop();
      await this.ui.showConnectionStatus({ lunchFlow: lfConnected, actualBudget: abConnected });
      
      return { lunchFlow: lfConnected, actualBudget: abConnected };
    } catch (error) {
      spinner.stop();
      this.ui.showError('Failed to test connections');
      return { lunchFlow: false, actualBudget: false };
    }
  }

  async configureAccountMappings(): Promise<void> {
    const spinner = this.ui.showSpinner('Loading accounts...');
    
    try {
      const [lfAccounts, abAccounts] = await Promise.all([
        this.lfClient.getAccounts(),
        this.abClient.getAccounts(),
      ]);

      spinner.stop();

      if (lfAccounts.length === 0) {
        this.ui.showError('No Lunch Flow accounts found');
        return;
      }

      if (abAccounts.length === 0) {
        this.ui.showError('No Actual Budget accounts found. Please create accounts in Actual Budget first, then run this command again to configure account mappings.');
        return;
      }

      // Show accounts for reference
      await this.ui.showAccountsTable(lfAccounts, '📡 Lunch Flow Accounts');
      await this.ui.showAccountsTable(abAccounts, '💰 Actual Budget Accounts');

      const mappings = await this.ui.configureAccountMappings(lfAccounts, abAccounts);
      
      if (this.config) {
        this.config.accountMappings = mappings;
        this.configManager.saveConfig(this.config);
        this.ui.showSuccess(`Configured ${mappings.length} account mappings`);
      }
    } catch (error) {
      spinner.stop();
      this.ui.showError('Failed to configure account mappings');
    }
  }

  async importTransactions(skipConfirmation: boolean = false, throwOnError: boolean = false): Promise<void> {
    if (!this.config || this.config.accountMappings.length === 0) {
      this.ui.showError('No account mappings configured. Please configure mappings first.');
      if (throwOnError) {
        throw new Error('No account mappings configured');
      }
      return;
    }

    // Test connections first
    const status = await this.testConnections();
    if (!status.lunchFlow || !status.actualBudget) {
      this.ui.showError('Cannot import: connections failed');
      if (throwOnError) {
        throw new Error('Connection test failed');
      }
      return;
    }

    const spinner = this.ui.showSpinner('Fetching transactions from all mapped accounts...');

    try {
      // Fetch transactions from all mapped accounts
      const allLfTransactions: LunchFlowTransaction[] = [];
      const accountResults: { account: string; count: number; success: boolean }[] = [];
      
      for (const mapping of this.config.accountMappings) {
        try {
          const accountTransactions = await this.lfClient.getTransactions(mapping.lunchFlowAccountId);
          
          // Filter transactions by sync start date if specified
          let filteredTransactions = accountTransactions;
          if (mapping.syncStartDate) {
            filteredTransactions = accountTransactions.filter(transaction => 
              transaction.date >= mapping.syncStartDate!
            );
          }

          allLfTransactions.push(...filteredTransactions);
          accountResults.push({
            account: `${mapping.lunchFlowAccountName} → ${mapping.actualBudgetAccountName}`,
            count: filteredTransactions.length,
            success: true
          });
        } catch (error) {
          console.warn(`Failed to fetch transactions for Lunch Flow account ${mapping.lunchFlowAccountId} (${mapping.lunchFlowAccountName}):`, error);
          accountResults.push({
            account: `${mapping.lunchFlowAccountName} → ${mapping.actualBudgetAccountName}`,
            count: 0,
            success: false
          });
          // Continue with other accounts even if one fails
        }
      }
      
      spinner.stop();

      // Show account processing summary
      console.log('\n📊 Account Processing Summary:');
      const table = new Table({
        head: ['Account Mapping', 'Sync Start Date', 'Transactions Found', 'Status'],
        colWidths: [40, 15, 20, 15]
      });
      
      accountResults.forEach((result, index) => {
        const mapping = this.config!.accountMappings[index];
        table.push([
          result.account,
          mapping.syncStartDate || 'None',
          result.count.toString(),
          result.success ? '✅ Success' : '❌ Failed'
        ]);
      });
      
      console.log(table.toString());

      if (allLfTransactions.length === 0) {
        this.ui.showInfo('No transactions found for any of the mapped accounts');
        return;
      }

      const mapper = new TransactionMapper(this.config.accountMappings);
      let abTransactions = mapper.mapTransactions(allLfTransactions);

      if (abTransactions.length === 0) {
        this.ui.showError('No transactions could be mapped to Actual Budget accounts');
        if (throwOnError) {
          throw new Error('No transactions could be mapped');
        }
        return;
      }

      // Check for duplicates if enabled
      if (this.config.actualBudget.duplicateCheckingAcrossAccounts) {
        const duplicateCheckSpinner = this.ui.showSpinner('Checking for duplicate transactions across all accounts...');
        try {
          const existingTransactions = await this.abClient.getTransactions();
          const duplicateDetector = new DuplicateTransactionDetector(existingTransactions);
          abTransactions = duplicateDetector.checkForDuplicates(abTransactions);
          
          const duplicateCount = duplicateDetector.getDuplicateCount(abTransactions);
          duplicateCheckSpinner.stop();
          
          if (duplicateCount > 0) {
            this.ui.showInfo(`Found ${duplicateCount} duplicate transactions that will be skipped`);
          }
        } catch (error) {
          duplicateCheckSpinner.stop();
          this.ui.showWarning('Failed to check for duplicates, proceeding without duplicate detection');
          console.warn('Duplicate check error:', error);
        }
      }

      const startDate = abTransactions.reduce((min, t) => t.date < min ? t.date : min, abTransactions[0].date);
      const endDate = abTransactions.reduce((max, t) => t.date > max ? t.date : max, abTransactions[0].date);

      // Show preview
      const abAccounts = await this.abClient.getAccounts();
      await this.ui.showTransactionPreview(abTransactions, abAccounts);

      // Filter out duplicates for import
      const uniqueTransactions = this.config.actualBudget.duplicateCheckingAcrossAccounts 
        ? abTransactions.filter(t => !t.isDuplicate)
        : abTransactions;

      if (!skipConfirmation) {
        const confirmed = await this.ui.confirmImport(uniqueTransactions.length, { startDate, endDate });
        if (!confirmed) {
          this.ui.showInfo('Import cancelled');
          if (throwOnError) {
            throw new Error('Import cancelled by user');
          }
          return;
        }
      } else {
        console.log(chalk.blue(`\n📥 Proceeding with import of ${uniqueTransactions.length} transactions (non-interactive mode)\n`));
      }

      if (uniqueTransactions.length === 0) {
        this.ui.showInfo('No unique transactions to import (all were duplicates)');
        return;
      }

      // Remove duplicate detection fields before import
      const cleanTransactions = uniqueTransactions.map(({ isDuplicate, duplicateOf, ...transaction }) => transaction);

      const importSpinner = this.ui.showSpinner(`Importing ${cleanTransactions.length} transactions...`);
      await this.abClient.importTransactions(cleanTransactions);
      importSpinner.stop();

      const accountCount = new Set(cleanTransactions.map(t => t.account)).size;
      this.config.accountMappings.forEach(mapping => {
          // Update sync start date to 7 days ago for next import to account for bank processing delays
          mapping.syncStartDate = new Date(Date.now() - 604800000).toISOString().split('T')[0];
      });
      this.configManager.saveConfig(this.config);

      this.ui.showSuccess(`Successfully imported ${cleanTransactions.length} transactions across ${accountCount} account(s)`);
      
      // Show duplicate summary if any were found
      if (this.config.actualBudget.duplicateCheckingAcrossAccounts) {
        const duplicateCount = abTransactions.length - uniqueTransactions.length;
        if (duplicateCount > 0) {
          this.ui.showInfo(`${duplicateCount} duplicate transactions were skipped`);
        }
      }
    } catch (error) {
      spinner.stop();
      this.ui.showError('Failed to import transactions');
      console.error('Import error:', error);
      if (throwOnError) {
        throw error;
      }
    }
  }

  async showCurrentMappings(): Promise<void> {
    if (this.config) {
      await this.ui.showAccountMappings(this.config.accountMappings);
    } else {
      this.ui.showError('No configuration found');
    }
  }

  async listAvailableBudgets(): Promise<void> {
    const spinner = this.ui.showSpinner('Fetching available budgets...');
    
    try {
      const budgets = await this.abClient.listAvailableBudgets();
      spinner.stop();

      if (budgets.length === 0) {
        this.ui.showWarning('No budgets found on the server');
        return;
      }

      console.log(chalk.blue('\n📋 Available Budgets\n'));
      const table = new Table({
        head: ['Name', 'ID'],
        colWidths: [30, 40],
        style: {
          head: ['cyan'],
          border: ['gray'],
        }
      });

      budgets.forEach(budget => {
        table.push([budget.name, budget.id]);
      });

      console.log(table.toString());
    } catch (error) {
      spinner.stop();
      this.ui.showError('Failed to fetch available budgets');
      console.error('Error:', error);
    }
  }

  async reconfigureCredentials(): Promise<void> {
    const action = await this.ui.showReconfigureMenu();
    
    if (action === 'cancel') return;

    if (action === 'lunchflow' || action === 'both') {
      const lfCreds = await this.ui.getLunchFlowCredentials();
      this.configManager.updateLunchFlowConfig(lfCreds.apiKey, lfCreds.baseUrl);
      this.ui.showSuccess('Lunch Flow credentials updated');
    }

    if (action === 'actualbudget' || action === 'both') {
      const abCreds = await this.ui.getActualBudgetCredentials();
      this.configManager.updateActualBudgetConfig(abCreds.serverUrl, abCreds.budgetSyncId, abCreds.password, abCreds.encryptionPassword, abCreds.duplicateCheckingAcrossAccounts);
      this.ui.showSuccess('Actual Budget credentials updated');
    }

    // Reload config and update clients
    this.config = this.configManager.loadConfig();
    this.updateClients();
  }

  async run(): Promise<void> {
    await this.initialize();

    while (true) {
      const action = await this.ui.showMainMenu();

      switch (action) {
        case 'test':
          await this.testConnections();
          break;
        case 'list-budgets':
          await this.listAvailableBudgets();
          break;
        case 'configure':
          await this.configureAccountMappings();
          break;
        case 'show':
          await this.showCurrentMappings();
          break;
        case 'import':
          await this.importTransactions();
          break;
        case 'reconfigure':
          await this.reconfigureCredentials();
          break;
        case 'exit':
          console.log(chalk.blue('\n👋 Goodbye!\n'));
          await this.abClient.shutdown();
          process.exit(0);
      }
    }
  }

  async runImport(): Promise<void> {
    await this.initialize();
    await this.importTransactions(true, true); // Skip confirmation and throw on error in non-interactive mode
    await this.abClient.shutdown();
  }
}
