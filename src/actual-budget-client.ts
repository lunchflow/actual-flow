import * as actualAPI from '@actual-app/api';
import { ActualBudgetTransaction, ActualBudgetAccount } from './types';
import fs from 'fs';
import path from 'path';

export class ActualBudgetClient {
  private serverUrl: string;
  private budgetSyncId: string;
  private password?: string;
  private connected: boolean = false;
  private dataDir: string;

  constructor(serverUrl: string, budgetSyncId: string, password?: string) {
    this.serverUrl = serverUrl;
    this.budgetSyncId = budgetSyncId;
    this.password = password;
    this.dataDir = './actual-data'; // Local cache directory
  }

  async connect(): Promise<boolean> {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      await actualAPI.init({
        dataDir: this.dataDir,
        serverURL: this.serverUrl,
        password: this.password,
      });
      
      // Download the budget to local cache
      await actualAPI.downloadBudget(this.budgetSyncId);
      
      this.connected = true;
      return true;
    } catch (error: any) {
      if (error.message.includes('budget directory does not exist')) {
        console.error(`Budget with sync ID "${this.budgetSyncId}" does not exist on the server.`);
        console.error('Please check your budget sync ID and try again.');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error(`Cannot connect to Actual Budget server at ${this.serverUrl}`);
        console.error('Please check that your Actual Budget server is running.');
      } else if (error.message.includes('not found')) {
        console.error(`Budget with sync ID "${this.budgetSyncId}" not found on the server.`);
        console.error('Please verify your budget sync ID in Actual Budget settings.');
      } else {
        console.error('Failed to connect to Actual Budget:', error.message);
      }
      this.connected = false;
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      return this.connected;
    } catch (error: any) {
      console.error('Actual Budget connection test failed:', error.message);
      return false;
    }
  }

  async getAccounts(): Promise<ActualBudgetAccount[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const accounts = await actualAPI.getAccounts();
      return accounts.map((account: any) => ({
        id: account.id,
        name: account.name,
        type: account.type as any,
        balance: actualAPI.utils.integerToAmount(account.balance || 0),
        currency: 'USD', // Assuming USD, adjust as needed
      }));
    } catch (error: any) {
      console.error('Failed to fetch Actual Budget accounts:', error.message);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  async importTransactions(transactions: ActualBudgetTransaction[]): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      await actualAPI.importTransactions(transactions[0].account, transactions);
    } catch (error: any) {
      console.error('Failed to import transactions to Actual Budget:', error.message);
      throw new Error(`Failed to import transactions: ${error.message}`);
    }
  }

  async listAvailableBudgets(): Promise<{ id: string; name: string }[]> {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      await actualAPI.init({
        dataDir: this.dataDir,
        serverURL: this.serverUrl,
        password: this.password,
      });
      
      const budgets = await actualAPI.getBudgets();
      return budgets.map((budget: any) => ({
        id: budget.id,
        name: budget.name || 'Unnamed Budget'
      }));
    } catch (error: any) {
      console.error('Failed to fetch available budgets:', error.message);
      throw new Error(`Failed to fetch budgets: ${error.message}`);
    }
  }

  async shutdown(): Promise<void> {
    try {
      await actualAPI.shutdown();
      this.connected = false;
    } catch (error: any) {
      console.error('Error during shutdown:', error.message);
    }
  }
}
