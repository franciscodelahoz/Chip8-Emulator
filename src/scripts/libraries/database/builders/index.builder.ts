import type {
  DBSchema, IndexNames, StoreNames, StoreValue,
} from '../../../types/database';

export class IndexBuilder<
  Schema extends DBSchema,
  StoreName extends StoreNames<Schema>,
> {
  constructor(private readonly store: IDBObjectStore) {}

  createIndex<
    IndexName extends IndexNames<Schema, StoreName>,
    T extends StoreValue<Schema, StoreName>,
    K extends string & keyof T,
  >(name: IndexName, keyPath: K, options?: IDBIndexParameters): IndexBuilder<Schema, StoreName> {
    this.store.createIndex(name, keyPath, options);

    return this;
  }
}
