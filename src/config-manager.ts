import fs from 'fs';
import path from 'path';
import { Config, AccountMapping } from './types';

export class ConfigManager {
  private configPath: string;

  constructor(configPath: string = path.join(process.cwd(), 'config.json')) {
    this.configPath = configPath;
  }

  loadConfig(): Config | null {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Validate config structure
      if (!this.validateConfig(config)) {
        console.warn('Invalid config file structure, will recreate');
        return null;
      }
      
      return config;
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  saveConfig(config: Config): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  createDefaultConfig(): Config {
    return {
      lunchFlow: {
        apiKey: '',
        baseUrl: 'https://api.lunchflow.com',
      },
      actualBudget: {
        serverUrl: '',
        budgetSyncId: '',
        password: '',
        encryptionPassword: undefined,
        duplicateCheckingAcrossAccounts: false, // Default to off
      },
      accountMappings: [],
    };
  }

  updateLunchFlowConfig(apiKey: string, baseUrl: string): void {
    const config = this.loadConfig() || this.createDefaultConfig();
    config.lunchFlow = { apiKey, baseUrl };
    this.saveConfig(config);
  }

  updateActualBudgetConfig(serverUrl: string, budgetSyncId: string, serverPassword: string, encryptionPassword?: string, duplicateCheckingAcrossAccounts?: boolean): void {
    const config = this.loadConfig() || this.createDefaultConfig();
    config.actualBudget = { 
      serverUrl, 
      budgetSyncId, 
      password: serverPassword, 
      encryptionPassword,
      duplicateCheckingAcrossAccounts: duplicateCheckingAcrossAccounts ?? config.actualBudget.duplicateCheckingAcrossAccounts ?? false
    };
    this.saveConfig(config);
  }

  updateAccountMappings(mappings: AccountMapping[]): void {
    const config = this.loadConfig();
    if (config) {
      config.accountMappings = mappings;
      this.saveConfig(config);
    }
  }

  private validateConfig(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      config.lunchFlow &&
      typeof config.lunchFlow.apiKey === 'string' &&
      typeof config.lunchFlow.baseUrl === 'string' &&
      config.actualBudget &&
      typeof config.actualBudget.serverUrl === 'string' &&
      typeof config.actualBudget.budgetSyncId === 'string' &&
      typeof config.actualBudget.password === 'string' &&
      (typeof config.actualBudget.encryptionPassword === 'string' || config.actualBudget.encryptionPassword === undefined) &&
      (typeof config.actualBudget.duplicateCheckingAcrossAccounts === 'boolean' || config.actualBudget.duplicateCheckingAcrossAccounts === undefined) &&
      Array.isArray(config.accountMappings)
    );
  }

  getConfigPath(): string {
    return this.configPath;
  }

  // Check if config exists and has required fields
  isConfigured(): boolean {
    const config = this.loadConfig();
    return config !== null && 
           config.lunchFlow.apiKey.length > 0 && 
           config.actualBudget.serverUrl.length > 0 && 
           config.actualBudget.budgetSyncId.length > 0 &&
           config.actualBudget.password.length > 0;
  }

  // Get a safe version of config for display (hides sensitive data)
  getSafeConfig(): Partial<Config> | null {
    const config = this.loadConfig();
    if (!config) return null;

    return {
      lunchFlow: {
        apiKey: config.lunchFlow.apiKey ? '***' + config.lunchFlow.apiKey.slice(-4) : '',
        baseUrl: config.lunchFlow.baseUrl,
      },
      actualBudget: {
        serverUrl: config.actualBudget.serverUrl,
        budgetSyncId: config.actualBudget.budgetSyncId,
        password: config.actualBudget.password ? '***' : '',
        encryptionPassword: config.actualBudget.encryptionPassword ? '***' : undefined,
      },
      accountMappings: config.accountMappings,
    };
  }
}
