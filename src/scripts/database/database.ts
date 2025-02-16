import { Order } from '../constants/database.constants';
import { database } from '../constants/emulator.constants';

export class DatabaseTool<T = any> {
  private readonly databaseName: string;

  private readonly databaseVersion: number;

  private databaseConnection: IDBDatabase | null = null;

  constructor(databaseName: string, version: number) {
    this.databaseName = databaseName;
    this.databaseVersion = version;
  }

  public async openDatabase(): Promise<void> {
    if (this.databaseConnection) return;

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.databaseVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
        const db = request.result;

        const customPalettesTable = db.createObjectStore(database.storage_name.custom_color_palettes, {
          keyPath       : 'id',
          autoIncrement : true,
        });

        customPalettesTable.createIndex('created_at', 'created_at', { unique: false });

        db.createObjectStore(database.storage_name.settings, {
          keyPath       : 'id',
          autoIncrement : true,
        });
      };

      request.onsuccess = (): void => {
        this.databaseConnection = request.result;
        resolve();
      };

      request.onerror = (event): void => {
        const { error } = event.target as IDBRequest;

        reject(new Error(`Error opening database: ${JSON.stringify(error)}`));
      };
    });
  }

  public closeDatabase(): void {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    this.databaseConnection.close();
    this.databaseConnection = null;
  }

  public async putObjectInDatabase(storageName: string, key: string, value: T): Promise<void> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(storageName, 'readwrite');
    const store = transaction.objectStore(storageName);

    const request = store.put({ id: key, ...value });

    return new Promise((resolve, reject) => {
      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(request.error);
    });
  }

  public async getObjectFromDatabase(storageName: string, key: string): Promise<T | null> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(storageName, 'readonly');
    const store = transaction.objectStore(storageName);

    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void => reject(request.error);
    });
  }

  public async removeElementFromDatabase(storageName: string, key: string): Promise<void> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(storageName, 'readwrite');
    const store = transaction.objectStore(storageName);

    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(request.error);
    });
  }

  public async* getAllElementsFromDatabase(storageName: string, orderBy?: string, order: Order = Order.NEXT): AsyncGenerator<T> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(storageName, 'readonly');
    const store = transaction.objectStore(storageName);

    let source: IDBIndex | IDBObjectStore = store;

    if (orderBy && store.indexNames.contains(orderBy)) {
      source = store.index(orderBy);
    }

    const request = source.openCursor(null, order);

    while (true) {
      const cursor = await new Promise<IDBCursorWithValue | null>((resolve, reject) => {
        request.onsuccess = (): void => resolve(request.result);
        request.onerror = (): void => reject(request.error);
      });

      if (cursor) {
        yield cursor.value;
        cursor.continue();
      } else {
        break;
      }
    }
  }
}
