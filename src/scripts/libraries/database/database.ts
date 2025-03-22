import { SchemaBuilder } from './builders/schema.builder';
import { StoreBuilder } from './builders/store.builder';
import { TransactionBuilder } from './builders/transaction.builder';
import type {
  DatabaseOptions, DBSchema, OnUpgradeCallback, StoreNames, StoreValue,
} from '../../types/database';

export class Database<Schema extends DBSchema> {
  private connection: IDBDatabase | null = null;

  private readonly databaseName: string;

  private readonly version: number;

  private readonly upgradeCallback?: OnUpgradeCallback<Schema>;

  constructor(options: DatabaseOptions<Schema>) {
    this.databaseName = options.database_name;
    this.version = options.version;
    this.upgradeCallback = options.onUpgradeCallback;
  }

  public async connect(): Promise<void> {
    if (this.connection) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version);

      request.addEventListener('upgradeneeded', (event) => {
        const db = request.result;

        if (this.upgradeCallback) {
          const builder = new SchemaBuilder(db);

          this.upgradeCallback(
            builder,
            event.oldVersion,
            event.newVersion,
          );
        }
      });

      request.addEventListener('success', () => {
        this.connection = request.result;
        resolve();
      });

      request.addEventListener('error', () => {
        reject(request.error);
      });
    });
  }

  public store<StoreName extends StoreNames<Schema>>(
    storeName: StoreName & string,
    mode: IDBTransactionMode = 'readonly',
  ): StoreBuilder<StoreValue<Schema, StoreName>, Schema, StoreName> {
    if (!this.connection) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    return new StoreBuilder<StoreValue<Schema, StoreName>, Schema, StoreName>(
      this.connection.transaction(storeName, mode).objectStore(storeName),
    );
  }

  public transaction<StoreName extends StoreNames<Schema>>(
    storeNames: (StoreName & string | StoreName[] & string[]),
    mode: IDBTransactionMode = 'readonly',
  ): TransactionBuilder<Schema, StoreName | StoreName[]> {
    if (!this.connection) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    return new TransactionBuilder<Schema>(
      this.connection.transaction(storeNames, mode),
    );
  }

  public close(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }
}
