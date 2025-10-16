import { ActualBudgetTransaction } from './types';

export interface DuplicateInfo {
  isDuplicate: boolean;
  duplicateOf?: string;
  existingTransaction?: ActualBudgetTransaction;
}

export class DuplicateTransactionDetector {
  private existingTransactions: Map<string, ActualBudgetTransaction> = new Map();

  constructor(existingTransactions: ActualBudgetTransaction[] = []) {
    this.buildTransactionMap(existingTransactions);
  }

  private buildTransactionMap(transactions: ActualBudgetTransaction[]): void {
    this.existingTransactions.clear();
    
    for (const transaction of transactions) {
      // Use imported_id as the primary key for duplicate detection
      if (transaction.imported_id) {
        this.existingTransactions.set(transaction.imported_id, transaction);
      }
    }
  }

  checkForDuplicates(newTransactions: ActualBudgetTransaction[]): ActualBudgetTransaction[] {
    return newTransactions.map(transaction => {
      const duplicateInfo = this.checkTransaction(transaction);
      
      return {
        ...transaction,
        isDuplicate: duplicateInfo.isDuplicate,
        duplicateOf: duplicateInfo.duplicateOf,
      };
    });
  }

  private checkTransaction(transaction: ActualBudgetTransaction): DuplicateInfo {
    if (!transaction.imported_id) {
      return { isDuplicate: false };
    }

    const existingTransaction = this.existingTransactions.get(transaction.imported_id);
    
    if (existingTransaction) {
      return {
        isDuplicate: true,
        duplicateOf: existingTransaction.id,
        existingTransaction,
      };
    }

    return { isDuplicate: false };
  }

  getDuplicateCount(transactions: ActualBudgetTransaction[]): number {
    return transactions.filter(t => t.isDuplicate).length;
  }

  getUniqueTransactions(transactions: ActualBudgetTransaction[]): ActualBudgetTransaction[] {
    return transactions.filter(t => !t.isDuplicate);
  }

  getDuplicateTransactions(transactions: ActualBudgetTransaction[]): ActualBudgetTransaction[] {
    return transactions.filter(t => t.isDuplicate);
  }
}
