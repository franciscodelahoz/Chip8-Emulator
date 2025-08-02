import { KeyCursorBuilder } from './key-cursor.builder';
import { ValueCursorBuilder } from './value-cursor.builder';
import { wrapRequest } from '../tools/wrap';
import type {
  DBSchema, IndexKey, IndexNames, StoreKey, StoreNames,
} from '../../../types/database';

export class IndexAccessor<
  T,
  Schema extends DBSchema,
  StoreName extends StoreNames<Schema>,
  IndexName extends IndexNames<Schema, StoreName>,
> {
  constructor(private readonly index: IDBIndex) {}

  async get(query: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>): Promise<T | undefined> {
    return wrapRequest<T | undefined>(this.index.get(query));
  }

  async getAll(query?: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>, count?: number): Promise<T[]> {
    return wrapRequest<T[]>(this.index.getAll(query, count));
  }

  async count(query?: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>): Promise<number> {
    return wrapRequest<number>(this.index.count(query));
  }

  async getKey(
    query: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>,
  ): Promise<StoreKey<Schema, StoreName> | undefined> {
    return wrapRequest<StoreKey<Schema, StoreName> | undefined>(
      this.index.getKey(query),
    );
  }

  async getAllKeys(
    query?: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>,
    count?: number,
  ): Promise<Array<StoreKey<Schema, StoreName>>> {
    return wrapRequest<Array<StoreKey<Schema, StoreName>>>(
      this.index.getAllKeys(query, count),
    );
  }

  async openCursor(
    query?: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>,
    direction?: IDBCursorDirection,
  ): Promise<ValueCursorBuilder<T, Schema, StoreName, IndexName> | null> {
    const cursor = await wrapRequest<IDBCursorWithValue | null>(
      this.index.openCursor(query as IDBKeyRange | IDBValidKey | undefined, direction),
    );

    if (cursor) {
      return new ValueCursorBuilder<T, Schema, StoreName, IndexName>(cursor);
    }

    return null;
  }

  async openKeyCursor(
    query?: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>,
    direction?: IDBCursorDirection,
  ): Promise<KeyCursorBuilder<Schema, StoreName, IndexName> | null> {
    const cursor = await wrapRequest<IDBCursor | null>(
      this.index.openKeyCursor(query as IDBKeyRange | IDBValidKey | undefined, direction),
    );

    if (cursor) {
      return new KeyCursorBuilder<Schema, StoreName, IndexName>(cursor);
    }

    return null;
  }

  async* iterate(
    query?: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>,
    direction: IDBCursorDirection = 'next',
  ): AsyncGenerator<T, void, unknown> {
    let cursor = await this.openCursor(query, direction);

    while (cursor) {
      yield cursor.value;
      cursor = await cursor.continue();
    }
  }

  async* iterateKeys(
    query?: IDBKeyRange | IndexKey<Schema, StoreName, IndexName>,
    direction: IDBCursorDirection = 'next',
  ): AsyncGenerator<StoreKey<Schema, StoreName>, void, unknown> {
    let cursor = await this.openKeyCursor(query, direction);

    while (cursor) {
      yield cursor.primaryKey;
      cursor = await cursor.continue();
    }
  }
}
