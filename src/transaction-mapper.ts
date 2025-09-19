import { LunchFlowTransaction, ActualBudgetTransaction, AccountMapping } from './types';

export class TransactionMapper {
  private accountMappings: AccountMapping[];

  constructor(accountMappings: AccountMapping[]) {
    this.accountMappings = accountMappings;
  }

  mapTransaction(lfTransaction: LunchFlowTransaction): ActualBudgetTransaction | null {
    const mapping = this.accountMappings.find(
      m => m.lunchFlowAccountId === lfTransaction.accountId
    );

    if (!mapping) {
      console.warn(`No mapping found for Lunch Flow account ${lfTransaction.accountId}`);
      return null;
    }

    return {
      date: lfTransaction.date,
      amount: lfTransaction.amount * 100,
      imported_payee: lfTransaction.merchant,
      account: mapping.actualBudgetAccountId,
      cleared: true, // Lunch Flow transactions are always cleared
      notes: lfTransaction.description,
      imported_id: `lf_${lfTransaction.id}`,
    };
  }

  mapTransactions(lfTransactions: LunchFlowTransaction[]): ActualBudgetTransaction[] {
    return lfTransactions
      .map(t => this.mapTransaction(t))
      .filter((t): t is ActualBudgetTransaction => t !== null);
  }

  // Add account name to transactions for preview purposes
  mapTransactionsWithAccountNames(lfTransactions: LunchFlowTransaction[]): (ActualBudgetTransaction & { account_name: string })[] {
    return lfTransactions
      .map(t => {
        const mapped = this.mapTransaction(t);
        if (!mapped) return null;
        
        const mapping = this.accountMappings.find(m => m.lunchFlowAccountId === t.accountId);
        return {
          ...mapped,
          account_name: mapping?.actualBudgetAccountName || 'Unknown'
        };
      })
      .filter((t): t is ActualBudgetTransaction & { account_name: string } => t !== null);
  }

}
