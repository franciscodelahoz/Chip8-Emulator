import type { SchemaBuilder } from '../libraries/database/builders/schema.builder';

export interface IndexKeys {
  [index: string]: IDBValidKey;
}

interface StoreFields {
  [field: string]: unknown;
}

interface DBStorageSchema {
  key: IDBValidKey;
  fields: StoreFields;
  indexes?: IndexKeys;
}

export interface DBSchema {
  [s: string]: DBStorageSchema;
}

type FilterNonLiteralKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K;
};

type ExtractValues<T> = T extends { [K in keyof T]: infer U } ? U : never;

type FilterObjectKeys<T> = ExtractValues<FilterNonLiteralKeys<T>>;

export type StoreNames<DBTypes extends DBSchema | null> =
  DBTypes extends DBSchema ? FilterObjectKeys<DBTypes> : string;

export type IndexNames<
  DBTypes extends DBSchema,
  StoreName extends StoreNames<DBTypes>,
> = StoreName extends keyof DBTypes
  ? DBTypes[StoreName] extends { indexes?: infer I }
    ? I extends IndexKeys
      ? string & keyof I
      : never
    : never
  : never;

export type StoreValue<
  DBTypes extends DBSchema,
  StoreName extends StoreNames<DBTypes>,
> = StoreName extends keyof DBTypes
  ? DBTypes[StoreName] extends { fields: infer F }
    ? F
    : never
  : never;

export type StoreKey<
  DBTypes extends DBSchema,
  StoreName extends StoreNames<DBTypes>,
> = StoreName extends keyof DBTypes
  ? DBTypes[StoreName] extends { key: infer F }
    ? F extends IDBValidKey ? F : never
    : never
  : never;

export type StoreKeyType<
  DBTypes extends DBSchema,
  StoreName extends StoreNames<DBTypes>,
> = StoreName extends keyof DBTypes
  ? DBTypes[StoreName] extends { key: infer K; fields: infer F }
    ? K extends keyof F
      ? K extends string
        ? F[K]
        : never
      : never
    : never
  : never;

export type IndexKey<
  DBTypes extends DBSchema,
  StoreName extends StoreNames<DBTypes>,
  IndexName extends IndexNames<DBTypes, StoreName>,
> = StoreName extends keyof DBTypes
  ? DBTypes[StoreName] extends { indexes?: infer I }
    ? I extends IndexKeys
      ? IndexName extends keyof I
        ? I[IndexName]
        : never
      : never
    : never
  : never;

export type OnUpgradeCallback<T extends DBSchema> =
  (builder: SchemaBuilder<T>, oldVersion?: number, newVersion?: number | null) => void;

export interface DatabaseOptions<Schema extends DBSchema> {
  database_name: string;
  version: number;
  onUpgradeCallback?: OnUpgradeCallback<Schema>;
}
