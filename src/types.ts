export type LunchFlowAccountId = number;
export interface LunchFlowTransaction {
  id: string | null; // Can be null for pending transactions
  accountId: LunchFlowAccountId;
  date: string;
  amount: number;
  currency: string;
  merchant: string;
  description: string;
  isPending?: boolean;
}

export interface LunchFlowAccount {
  id: LunchFlowAccountId;
  name: string;
  institution_name: string;
}

export interface ActualBudgetTransaction {
  id?: string;
  date: string;
  amount: number;
  imported_payee: string;
  payee_name: string;
  account: string;
  cleared?: boolean;
  notes?: string;
  imported_id?: string;
  isDuplicate?: boolean;
  duplicateOf?: string; // ID of the existing transaction this duplicates
  isPending?: boolean;
}

export interface ActualBudgetAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
}

export interface AccountMapping {
  lunchFlowAccountId: LunchFlowAccountId;
  lunchFlowAccountName: string;
  actualBudgetAccountId: string;
  actualBudgetAccountName: string;
  syncStartDate?: string; // Optional sync start date in YYYY-MM-DD format
  includePending?: boolean;
}

export interface Config {
  lunchFlow: {
    apiKey: string;
    baseUrl: string;
  };
  actualBudget: {
    serverUrl: string;
    budgetSyncId: string;
    password: string; // Server password (backward compatible)
    encryptionPassword?: string; // Optional password for end-to-end encryption
    duplicateCheckingAcrossAccounts?: boolean; // Check for duplicate transactions across all accounts before import
  };
  accountMappings: AccountMapping[];
}

export interface ConnectionStatus {
  lunchFlow: boolean;
  actualBudget: boolean;
}
