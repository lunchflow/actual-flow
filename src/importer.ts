import { LunchFlowClient } from './lunch-flow-client';
import { ActualBudgetClient } from './actual-budget-client';
import { TransactionMapper } from './transaction-mapper';
import { ConfigManager } from './config-manager';
import { TerminalUI } from './ui';
import { Config, AccountMapping, ConnectionStatus } from './types';
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
    this.abClient = new ActualBudgetClient('', '');
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
        this.config.actualBudget.password
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
        this.ui.showError('No Actual Budget accounts found');
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

  async importTransactions(): Promise<void> {
    if (!this.config || this.config.accountMappings.length === 0) {
      this.ui.showError('No account mappings configured. Please configure mappings first.');
      return;
    }

    // Test connections first
    const status = await this.testConnections();
    if (!status.lunchFlow || !status.actualBudget) {
      this.ui.showError('Cannot import: connections failed');
      return;
    }

    const spinner = this.ui.showSpinner('Fetching transactions...');

    try {
      const lfTransactions = await this.lfClient.getTransactions(this.config.accountMappings[0].lunchFlowAccountId);
      spinner.stop();

      if (lfTransactions.length === 0) {
        this.ui.showInfo('No transactions found for the selected date range');
        return;
      }

      const mapper = new TransactionMapper(this.config.accountMappings);
      const abTransactions = mapper.mapTransactions(lfTransactions);

      if (abTransactions.length === 0) {
        this.ui.showError('No transactions could be mapped to Actual Budget accounts');
        return;
      }

      const startDate = abTransactions.reduce((min, t) => t.date < min ? t.date : min, abTransactions[0].date);
      const endDate = abTransactions.reduce((max, t) => t.date > max ? t.date : max, abTransactions[0].date);

      // Show preview
      const abAccounts = await this.abClient.getAccounts();
      await this.ui.showTransactionPreview(abTransactions, abAccounts);

      const confirmed = await this.ui.confirmImport(abTransactions.length, { startDate, endDate });
      if (!confirmed) {
        this.ui.showInfo('Import cancelled');
        return;
      }

      const importSpinner = this.ui.showSpinner(`Importing ${abTransactions.length} transactions...`);
      await this.abClient.importTransactions(abTransactions);
      importSpinner.stop();

      this.ui.showSuccess(`Successfully imported ${abTransactions.length} transactions`);
    } catch (error) {
      spinner.stop();
      this.ui.showError('Failed to import transactions');
      console.error('Import error:', error);
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
      this.configManager.updateActualBudgetConfig(abCreds.serverUrl, abCreds.budgetSyncId, abCreds.password);
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
}
