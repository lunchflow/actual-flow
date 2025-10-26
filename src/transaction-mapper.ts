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

    if (lfTransaction.merchant == null || lfTransaction.merchant.trim() === '') {
      console.warn(`Found transaction ${lfTransaction.id} with empty merchant`);
      if (lfTransaction.amount < 0 && mapping.merchantFromDescriptionRegex?.pattern) {
        console.warn(`Will attempt to extract merchant from description using regex ${mapping.merchantFromDescriptionRegex.pattern}`);
        try {
          const regex = new RegExp(
            mapping.merchantFromDescriptionRegex.pattern,
            mapping.merchantFromDescriptionRegex.flags
          );
          lfTransaction.merchant = lfTransaction.description.match(regex)?.[1]?.trim() ?? '';
        } catch (error: any) {
          console.warn(`Invalid regex pattern in mapping: ${error.message}`);
          lfTransaction.merchant = '';
        }
      }
    }

    return {
      date: lfTransaction.date,
      // Forcing to fixed point integer to avoid floating point precision issues
      amount: parseInt((lfTransaction.amount * 100).toFixed(0)),
      payee_name: lfTransaction.merchant,
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
}
