import { IndexBuilder } from './index.builder';
import type { DBSchema, StoreKey, StoreNames } from '../../../types/database';

export class SchemaBuilder<Schema extends DBSchema> {
  constructor(private readonly db: IDBDatabase) {}

  createStore<
    StoreName extends StoreNames<Schema>,
  >(name: StoreName & string, keyPath: StoreKey<Schema, StoreName>): IndexBuilder<Schema, StoreName> {
    const store = this.db.createObjectStore(name, { keyPath });

    return new IndexBuilder(store);
  }
}
