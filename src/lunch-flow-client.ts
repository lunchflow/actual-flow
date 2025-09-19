import axios, { AxiosInstance } from 'axios';
import { LunchFlowTransaction, LunchFlowAccount, LunchFlowAccountId } from './types';

export class LunchFlowClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.lunchflow.com') {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'x-api-key': apiKey,
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
      if (Array.isArray(response.data.accounts)) {
        return response.data.accounts;
      } else {
        console.warn('Unexpected response structure from Lunch Flow accounts endpoint');
        return [];
      }
    } catch (error: any) {
      console.error('Failed to fetch Lunch Flow accounts:', error.message);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  async getTransactions(accountId: LunchFlowAccountId): Promise<LunchFlowTransaction[]> {
    try {
      const response = await this.client.get(`/accounts/${accountId}/transactions`);
      
      // Handle different possible response structures
      if (Array.isArray(response.data.transactions)) {
        return response.data.transactions;
      } else {
        console.warn('Unexpected response structure from Lunch Flow transactions endpoint');
        return [];
      }
    } catch (error: any) {
      console.error('Failed to fetch Lunch Flow transactions:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }
}
