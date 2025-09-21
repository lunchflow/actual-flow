export type LunchFlowAccountId = number;
export interface LunchFlowTransaction {
  id: string;
  accountId: LunchFlowAccountId;
  date: string;
  amount: number;
  currency: string;
  merchant: string;
  description: string;
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
}

export interface Config {
  lunchFlow: {
    apiKey: string;
    baseUrl: string;
  };
  actualBudget: {
    serverUrl: string;
    budgetSyncId: string;
    password?: string;
  };
  accountMappings: AccountMapping[];
}

export interface ConnectionStatus {
  lunchFlow: boolean;
  actualBudget: boolean;
}
