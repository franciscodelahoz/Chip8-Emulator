import { IndexBuilder } from './index.builder';
import type { DBSchema, StoreNames } from '../../../types/database';

export class SchemaBuilder<Schema extends DBSchema> {
  constructor(private readonly db: IDBDatabase) {}

  createStore<StoreName extends StoreNames<Schema>>(name: StoreName & string, keyPath: string): IndexBuilder<Schema, StoreName> {
    const store = this.db.createObjectStore(name, { keyPath });

    return new IndexBuilder(store);
  }
}
