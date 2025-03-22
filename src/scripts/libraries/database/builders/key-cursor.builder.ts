import { CursorBuilderBase } from './cursor-base.builder';
import type { DBSchema, IndexNames, StoreNames } from '../../../types/database';

export class KeyCursorBuilder<
  Schema extends DBSchema,
  StoreName extends StoreNames<Schema>,
  IndexName extends IndexNames<Schema, StoreName> | undefined = undefined,
> extends CursorBuilderBase<Schema, StoreName, IndexName> {}
