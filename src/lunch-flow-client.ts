import axios, { AxiosInstance } from 'axios';
import { LunchFlowTransaction, LunchFlowAccount } from './types';

export class LunchFlowClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.lunchflow.com') {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to get accounts as a health check
      const response = await this.client.get('/accounts');
      return response.status === 200;
    } catch (error: any) {
      console.error('Lunch Flow connection test failed:', error.message);
      return false;
    }
  }

  async getAccounts(): Promise<LunchFlowAccount[]> {
    try {
      const response = await this.client.get('/accounts');
      
      // Handle different possible response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.accounts) {
        return response.data.accounts;
      } else if (response.data.data) {
        return response.data.data;
      } else {
        console.warn('Unexpected response structure from Lunch Flow accounts endpoint');
        return [];
      }
    } catch (error: any) {
      console.error('Failed to fetch Lunch Flow accounts:', error.message);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  async getTransactions(accountId?: string, startDate?: string, endDate?: string): Promise<LunchFlowTransaction[]> {
    try {
      const params: any = {};
      if (accountId) params.account_id = accountId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await this.client.get('/transactions', { params });
      
      // Handle different possible response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.transactions) {
        return response.data.transactions;
      } else if (response.data.data) {
        return response.data.data;
      } else {
        console.warn('Unexpected response structure from Lunch Flow transactions endpoint');
        return [];
      }
    } catch (error: any) {
      console.error('Failed to fetch Lunch Flow transactions:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  async getTransactionsForDateRange(startDate: string, endDate: string): Promise<LunchFlowTransaction[]> {
    return this.getTransactions(undefined, startDate, endDate);
  }
}
