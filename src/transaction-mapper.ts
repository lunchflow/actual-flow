import { LunchFlowTransaction, ActualBudgetTransaction, AccountMapping } from './types';

export class TransactionMapper {
  private accountMappings: AccountMapping[];

  constructor(accountMappings: AccountMapping[]) {
    this.accountMappings = accountMappings;
  }

  mapTransaction(lfTransaction: LunchFlowTransaction): ActualBudgetTransaction | null {
    const mapping = this.accountMappings.find(
      m => m.lunchFlowAccountId === lfTransaction.account_id
    );

    if (!mapping) {
      console.warn(`No mapping found for Lunch Flow account ${lfTransaction.account_id}`);
      return null;
    }

    return {
      date: lfTransaction.date,
      amount: lfTransaction.amount,
      description: lfTransaction.description,
      account_id: mapping.actualBudgetAccountId,
      category_id: lfTransaction.category_id,
      payee_id: lfTransaction.payee,
      cleared: lfTransaction.cleared || false,
      notes: lfTransaction.notes,
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
        
        const mapping = this.accountMappings.find(m => m.lunchFlowAccountId === t.account_id);
        return {
          ...mapped,
          account_name: mapping?.actualBudgetAccountName || 'Unknown'
        };
      })
      .filter((t): t is ActualBudgetTransaction & { account_name: string } => t !== null);
  }

  // Check if a transaction already exists (for deduplication)
  isTransactionAlreadyImported(transaction: ActualBudgetTransaction, existingTransactions: ActualBudgetTransaction[]): boolean {
    return existingTransactions.some(existing => 
      existing.imported_id === transaction.imported_id ||
      (existing.date === transaction.date && 
       existing.amount === transaction.amount && 
       existing.description === transaction.description &&
       existing.account_id === transaction.account_id)
    );
  }

  // Filter out already imported transactions
  filterNewTransactions(
    newTransactions: ActualBudgetTransaction[], 
    existingTransactions: ActualBudgetTransaction[]
  ): ActualBudgetTransaction[] {
    return newTransactions.filter(transaction => 
      !this.isTransactionAlreadyImported(transaction, existingTransactions)
    );
  }
}
