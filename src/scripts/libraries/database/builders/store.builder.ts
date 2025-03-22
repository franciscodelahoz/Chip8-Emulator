import { IndexAccessor } from './index-accessor.builder';
import { KeyCursorBuilder } from './key-cursor.builder';
import { ValueCursorBuilder } from './value-cursor.builder';
import type {
  DBSchema, IndexNames, StoreKey, StoreKeyType, StoreNames,
} from '../../../types/database';
import { wrapRequest } from '../tools/wrap';

export class StoreBuilder<
  T,
  Schema extends DBSchema,
  StoreName extends StoreNames<Schema>,
> {
  constructor(private readonly store: IDBObjectStore) {}

  get indexNames(): Array<IndexNames<Schema, StoreName>> {
    return Array.from(this.store.indexNames) as Array<IndexNames<Schema, StoreName>>;
  }

  async get(query: IDBKeyRange | StoreKeyType<Schema, StoreName>): Promise<T | undefined> {
    return wrapRequest<T | undefined>(this.store.get(query));
  }

  async getAll(query?: IDBKeyRange | StoreKeyType<Schema, StoreName>, count?: number): Promise<T[]> {
    return wrapRequest<T[]>(this.store.getAll(query, count));
  }

  async put(value: T, key?: StoreKeyType<Schema, StoreName>): Promise<StoreKey<Schema, StoreName>> {
    return wrapRequest<StoreKey<Schema, StoreName>>(
      this.store.put(value, key as IDBValidKey),
    );
  }

  async add(value: T, key?: StoreKeyType<Schema, StoreName>): Promise<StoreKey<Schema, StoreName>> {
    return wrapRequest<StoreKey<Schema, StoreName>>(
      this.store.add(value, key as IDBValidKey),
    );
  }

  async delete(query: IDBKeyRange | StoreKeyType<Schema, StoreName>): Promise<void> {
    return wrapRequest<void>(this.store.delete(query));
  }

  async count(query?: IDBKeyRange | StoreKeyType<Schema, StoreName>): Promise<number> {
    return wrapRequest<number>(this.store.count(query));
  }

  async clear(): Promise<void> {
    return wrapRequest<void>(this.store.clear());
  }

  async openCursor(
    query?: IDBKeyRange | StoreKeyType<Schema, StoreName>,
    direction?: IDBCursorDirection,
  ): Promise<ValueCursorBuilder<T, Schema, StoreName> | null> {
    const cursor = await wrapRequest<IDBCursorWithValue | null>(
      this.store.openCursor(query as IDBKeyRange | IDBValidKey | undefined, direction),
    );

    if (cursor) {
      return new ValueCursorBuilder<T, Schema, StoreName>(cursor);
    }

    return null;
  }

  async openKeyCursor(
    query?: IDBKeyRange | StoreKeyType<Schema, StoreName>,
    direction?: IDBCursorDirection,
  ): Promise<KeyCursorBuilder<Schema, StoreName> | null> {
    const cursor = await wrapRequest<IDBCursor | null>(
      this.store.openKeyCursor(query as IDBKeyRange | IDBValidKey | undefined, direction),
    );

    if (cursor) {
      return new KeyCursorBuilder<Schema, StoreName>(cursor);
    }

    return null;
  }

  index<IndexName extends IndexNames<Schema, StoreName>>(
    name: IndexName & string,
  ): IndexAccessor<T, Schema, StoreName, IndexName> {
    return new IndexAccessor<T, Schema, StoreName, IndexName>(this.store.index(name));
  }

  async* iterate(
    query?: IDBKeyRange | StoreKeyType<Schema, StoreName>,
    direction: IDBCursorDirection = 'next',
  ): AsyncGenerator<T, void, unknown> {
    let cursor = await this.openCursor(query, direction);

    while (cursor) {
      yield cursor.value;
      cursor = await cursor.continue();
    }
  }

  async* iterateKeys(
    query?: IDBKeyRange | StoreKeyType<Schema, StoreName>,
    direction: IDBCursorDirection = 'next',
  ): AsyncGenerator<StoreKey<Schema, StoreName>, void, unknown> {
    let cursor = await this.openKeyCursor(query, direction);

    while (cursor) {
      yield cursor.key;
      cursor = await cursor.continue();
    }
  }
}
