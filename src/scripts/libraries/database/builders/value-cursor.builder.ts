import { CursorBuilderBase } from './cursor-base.builder';
import { wrapRequest } from '../tools/wrap';
import type {
  DBSchema, IndexNames, StoreKey, StoreNames,
} from '../../../types/database';

export class ValueCursorBuilder<
  T,
  Schema extends DBSchema,
  StoreName extends StoreNames<Schema>,
  IndexName extends IndexNames<Schema, StoreName> | undefined = undefined,
> extends CursorBuilderBase<Schema, StoreName, IndexName> {
  constructor(private readonly valueCursor: IDBCursorWithValue) {
    super(valueCursor);
  }

  get value(): T {
    return this.valueCursor.value as T;
  }

  async update(value: T): Promise<StoreKey<Schema, StoreName>> {
    return wrapRequest<StoreKey<Schema, StoreName>>(
      this.valueCursor.update(value),
    );
  }

  async delete(): Promise<void> {
    return wrapRequest<void>(this.valueCursor.delete());
  }
}
