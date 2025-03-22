import { StoreBuilder } from './store.builder';
import type { DBSchema, StoreNames, StoreValue } from '../../../types/database';
import { wrapTransaction } from '../tools/wrap';

export class TransactionBuilder<
  Schema extends DBSchema,
  TxStores extends ReadonlyArray<StoreNames<Schema>> | StoreNames<Schema> = StoreNames<Schema>,
> {
  constructor(private readonly tx: IDBTransaction) {}

  store<StoreName extends TxStores extends ReadonlyArray<infer S> ? S : TxStores>(
    storeName: StoreName & string,
  ): StoreBuilder<StoreValue<Schema, StoreName & StoreNames<Schema>>, Schema, StoreName & StoreNames<Schema>> {
    return new StoreBuilder(
      this.tx.objectStore(storeName),
    );
  }

  public async done(): Promise<void> {
    return wrapTransaction(this.tx);
  }

  public abort(): void {
    this.tx.abort();
  }
}
