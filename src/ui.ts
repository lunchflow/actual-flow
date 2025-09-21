import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { LunchFlowAccount, ActualBudgetAccount, AccountMapping, ConnectionStatus, ActualBudgetTransaction } from './types';

export class TerminalUI {
  async showWelcome(): Promise<void> {
    console.clear();
    console.log(chalk.blue.bold('\n🍽️  Lunch Flow → Actual Budget Importer\n'));
    console.log(chalk.gray('This tool helps you import transactions from Lunch Flow to Actual Budget\n'));
  }

  async getLunchFlowCredentials(): Promise<{ apiKey: string; baseUrl: string }> {
    console.log(chalk.yellow('📡 Lunch Flow Configuration\n'));
    console.log(chalk.gray('To find your Lunch Flow API key:'));
    console.log(chalk.gray('1. Login to Lunch Flow: https://lunchflow.app'));
    console.log(chalk.gray('2. Go to Destinations → create a new API destination'));
    console.log(chalk.gray('3. Look for "API Key" - that\'s your API key\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Lunch Flow API key:',
        validate: (input: string) => input.length > 0 || 'API key is required',
        mask: '*',
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Enter Lunch Flow API base URL:',
        default: 'https://lunchflow.app/api/v1',
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      },
    ]);
    return answers;
  }

  async getActualBudgetCredentials(): Promise<{ serverUrl: string; budgetSyncId: string; password?: string }> {
    console.log(chalk.yellow('\n💰 Actual Budget Configuration\n'));
    console.log(chalk.gray('To find your budget sync ID:'));
    console.log(chalk.gray('1. Open Actual Budget in your browser'));
    console.log(chalk.gray('2. Go to Settings → Show advanced settings'));
    console.log(chalk.gray('3. Look for "Sync ID" - that\'s your budget sync ID\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serverUrl',
        message: 'Enter Actual Budget server URL:',
        default: 'http://localhost:5006',
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      },
      {
        type: 'input',
        name: 'budgetSyncId',
        message: 'Enter Actual Budget budget sync ID:',
        validate: (input: string) => input.length > 0 || 'Budget sync ID is required',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter Actual Budget password (optional):',
        mask: '*',
      },
    ]);
    return answers;
  }

  async showConnectionStatus(status: ConnectionStatus): Promise<void> {
    console.log(chalk.blue('\n🔗 Connection Status\n'));
    
    const lfStatus = status.lunchFlow ? chalk.green('✅ Connected') : chalk.red('❌ Disconnected');
    const abStatus = status.actualBudget ? chalk.green('✅ Connected') : chalk.red('❌ Disconnected');
    
    console.log(`Lunch Flow: ${lfStatus}`);
    console.log(`Actual Budget: ${abStatus}\n`);
  }

  async showAccountsTable(accounts: (LunchFlowAccount | ActualBudgetAccount)[], title: string): Promise<void> {
    console.log(chalk.blue(`\n${title}\n`));
    
    if (accounts.length === 0) {
      console.log(chalk.yellow('No accounts found.\n'));
      return;
    }

    const table = new Table({
      head: ['ID', 'Name'],
      colWidths: [8, 25],
      style: {
        head: ['cyan'],
        border: ['gray'],
      }
    });

    accounts.forEach(account => {
      table.push([
        account.id.toString().substring(0, 8) + '...',
        account.name,
      ]);
    });

    console.log(table.toString());
  }

  async configureAccountMappings(
    lfAccounts: LunchFlowAccount[],
    abAccounts: ActualBudgetAccount[]
  ): Promise<AccountMapping[]> {
    console.log(chalk.yellow('\n📋 Configure Account Mappings\n'));
    console.log(chalk.gray('Map each Lunch Flow account to an Actual Budget account:\n'));

    const mappings: AccountMapping[] = [];

    for (const lfAccount of lfAccounts) {
      const choices = abAccounts.map(abAccount => ({
        name: `${abAccount.name} (${abAccount.currency})`,
        value: abAccount.id,
      }));

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'abAccountId',
          message: `Map "${lfAccount.name}" (${lfAccount.institution_name}) to:`,
          choices: [
            { name: 'Skip this account', value: 'skip' },
            ...choices,
          ],
        },
      ]);

      if (answer.abAccountId !== 'skip') {
        const abAccount = abAccounts.find(a => a.id === answer.abAccountId);
        if (abAccount) {
          // Ask for optional sync start date
          const dateAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'syncStartDate',
              message: `Sync start date for "${lfAccount.name}" (YYYY-MM-DD, optional - press Enter to skip):`,
              validate: (input: string) => {
                if (!input.trim()) return true; // Empty is allowed
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(input)) {
                  return 'Please enter date in YYYY-MM-DD format or leave empty';
                }
                const date = new Date(input);
                if (isNaN(date.getTime())) {
                  return 'Please enter a valid date';
                }
                return true;
              },
            },
          ]);

          const mapping: AccountMapping = {
            lunchFlowAccountId: lfAccount.id,
            lunchFlowAccountName: lfAccount.name,
            actualBudgetAccountId: abAccount.id,
            actualBudgetAccountName: abAccount.name,
          };

          if (dateAnswer.syncStartDate.trim()) {
            mapping.syncStartDate = dateAnswer.syncStartDate.trim();
          }

          mappings.push(mapping);
        }
      }
    }

    return mappings;
  }

  async showAccountMappings(mappings: AccountMapping[]): Promise<void> {
    console.log(chalk.blue('\n📋 Current Account Mappings\n'));
    
    if (mappings.length === 0) {
      console.log(chalk.yellow('No account mappings configured.\n'));
      return;
    }

    const table = new Table({
      head: ['Lunch Flow Account', '→', 'Actual Budget Account', 'Sync Start Date'],
      colWidths: [25, 3, 25, 15],
      style: {
        head: ['cyan'],
        border: ['gray'],
      }
    });

    mappings.forEach(mapping => {
      table.push([
        mapping.lunchFlowAccountName,
        '→',
        mapping.actualBudgetAccountName,
        mapping.syncStartDate || chalk.gray('None')
      ]);
    });

    console.log(table.toString());
  }

  async confirmImport(transactionCount: number, dateRange: { startDate: string; endDate: string }): Promise<boolean> {
    console.log(chalk.yellow('\n⚠️  Import Confirmation\n'));
    console.log(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`);
    console.log(`Transactions to import: ${transactionCount}\n`);
    
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with import?',
        default: true,
      },
    ]);
    return answer.confirm;
  }

  async showMainMenu(): Promise<string> {
    console.log(chalk.blue('\n🎯 Main Menu\n'));
    
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔗 Test connections', value: 'test' },
          { name: '📋 List available budgets', value: 'list-budgets' },
          { name: '📋 Configure account mappings', value: 'configure' },
          { name: '📊 Show current mappings', value: 'show' },
          { name: '📥 Import transactions', value: 'import' },
          { name: '⚙️  Reconfigure credentials', value: 'reconfigure' },
          { name: '❌ Exit', value: 'exit' },
        ],
      },
    ]);
    return answer.action;
  }

  async showReconfigureMenu(): Promise<string> {
    console.log(chalk.yellow('\n⚙️  Reconfigure Credentials\n'));
    
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to reconfigure?',
        choices: [
          { name: 'Lunch Flow credentials', value: 'lunchflow' },
          { name: 'Actual Budget credentials', value: 'actualbudget' },
          { name: 'Both', value: 'both' },
          { name: 'Cancel', value: 'cancel' },
        ],
      },
    ]);
    return answer.action;
  }

  showSpinner(message: string): any {
    return ora(message).start();
  }

  showSuccess(message: string): void {
    console.log(chalk.green(`✅ ${message}`));
  }

  showError(message: string): void {
    console.log(chalk.red(`❌ ${message}`));
  }

  showInfo(message: string): void {
    console.log(chalk.blue(`ℹ️  ${message}`));
  }

  showWarning(message: string): void {
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  async showTransactionPreview(transactions: ActualBudgetTransaction[], accounts: ActualBudgetAccount[], count: number = 10): Promise<void> {
    console.log(chalk.blue(`\n📊 Transaction Preview (showing first ${Math.min(count, transactions.length)})\n`));
    
    if (transactions.length === 0) {
      console.log(chalk.yellow('No transactions to preview.\n'));
      return;
    }

    const accountNames = accounts.reduce((acc, account) => {
      acc[account.id] = account.name;
      return acc;
    }, {} as Record<string, string>);

    const table = new Table({
      head: ['Date', 'Description', 'Amount', 'Account'],
      colWidths: [12, 30, 12, 20],
      style: {
        head: ['cyan'],
        border: ['gray'],
      }
    });

    transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count)
      .forEach(transaction => {
        const amount = transaction.amount / 100;
        const amountDisplay = transaction.amount >= 0 
          ? chalk.green(`+${amount.toFixed(2)}`)
          : chalk.red(`-${Math.abs(amount).toFixed(2)}`);
        
        table.push([
          transaction.date,
          transaction.imported_payee,
          amountDisplay,
          accountNames[transaction.account] || 'Unknown'
        ]);
      });

    console.log(table.toString());
    
    if (transactions.length > count) {
      console.log(chalk.gray(`... and ${transactions.length - count} more transactions\n`));
    } else {
      console.log();
    }
  }
}
