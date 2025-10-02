import axios, { AxiosInstance, AxiosError } from 'axios';
import { LunchFlowTransaction, LunchFlowAccount, LunchFlowAccountId } from './types';

export class LunchFlowClient {
  private client: AxiosInstance;
  private apiKey: string;
  private readonly maxRetries: number = 3;

  constructor(apiKey: string, baseUrl: string = 'https://api.lunchflow.com') {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const isRetriableError = this.isRetriableError(error);
      
      if (retryCount < this.maxRetries && isRetriableError) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`${operationName} failed (attempt ${retryCount + 1}/${this.maxRetries + 1}). Retrying in ${backoffDelay}ms...`);
        console.log(`Error: ${error.message}`);
        
        await this.sleep(backoffDelay);
        return this.retryWithBackoff(operation, operationName, retryCount + 1);
      }
      
      // Log final failure
      if (retryCount >= this.maxRetries) {
        console.error(`${operationName} failed after ${this.maxRetries + 1} attempts. Final error: ${error.message}`);
      }
      
      throw error;
    }
  }

  private isRetriableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }
    
    if (error.response?.status >= 500) {
      return true;
    }
    
    // Retry on timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      return true;
    }
    
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.retryWithBackoff(async () => {
        // Try to get accounts as a health check
        const response = await this.client.get('/accounts');
        return response.status === 200;
      }, 'Test Lunch Flow connection');
    } catch (error: any) {
      console.error('Lunch Flow connection test failed after all retries:', error.message);
      return false;
    }
  }

  async getAccounts(): Promise<LunchFlowAccount[]> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.get('/accounts');
      
      // Handle different possible response structures
      if (Array.isArray(response.data.accounts)) {
        return response.data.accounts;
      } else {
        console.warn('Unexpected response structure from Lunch Flow accounts endpoint');
        return [];
      }
    }, 'Fetch Lunch Flow accounts');
  }

  async getTransactions(accountId: LunchFlowAccountId): Promise<LunchFlowTransaction[]> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/accounts/${accountId}/transactions`);
      
      // Handle different possible response structures
      if (Array.isArray(response.data.transactions)) {
        return response.data.transactions;
      } else {
        console.warn('Unexpected response structure from Lunch Flow transactions endpoint');
        return [];
      }
    }, `Fetch transactions for account ${accountId}`);
  }
}
