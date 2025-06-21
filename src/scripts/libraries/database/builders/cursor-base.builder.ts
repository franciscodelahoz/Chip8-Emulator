import type {
  DBSchema, IndexKey, IndexNames, StoreKey, StoreNames,
} from '../../../types/database';
import { wrapRequest } from '../tools/wrap';

export abstract class CursorBuilderBase<
  Schema extends DBSchema,
  StoreName extends StoreNames<Schema>,
  IndexName extends IndexNames<Schema, StoreName> | undefined = undefined,
> {
  constructor(
    protected readonly cursor: IDBCursor,
  ) {}

  get key(): IndexName extends IndexNames<Schema, StoreName> ?
    IndexKey<Schema, StoreName, IndexName & IndexNames<Schema, StoreName>> :
    StoreKey<Schema, StoreName> {
    return (this.cursor.key as unknown) as (IndexName extends IndexNames<Schema, StoreName> ?
      IndexKey<Schema, StoreName, IndexName & IndexNames<Schema, StoreName>> :
      StoreKey<Schema, StoreName>);
  }

  get primaryKey(): StoreKey<Schema, StoreName> {
    return this.cursor.primaryKey as StoreKey<Schema, StoreName>;
  }

  async continue(): Promise<this | null> {
    this.cursor.continue();

    const result = await wrapRequest<IDBCursor | null>(this.cursor.request);

    return result ? this : null;
  }

  async advance(count: number): Promise<this | null> {
    this.cursor.advance(count);

    const result = await wrapRequest<IDBCursor | null>(this.cursor.request);

    return result ? this : null;
  }
}
