export interface LunchFlowTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  account_id: string;
  category_id?: string;
  payee?: string;
  cleared?: boolean;
  notes?: string;
}

export interface LunchFlowAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
}

export interface ActualBudgetTransaction {
  id?: string;
  date: string;
  amount: number;
  description: string;
  account_id: string;
  category_id?: string;
  payee_id?: string;
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
  lunchFlowAccountId: string;
  lunchFlowAccountName: string;
  actualBudgetAccountId: string;
  actualBudgetAccountName: string;
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
