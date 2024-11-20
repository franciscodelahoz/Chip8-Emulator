import type { IStore } from '../abstract/store.abstract';
import type { Order } from '../constants/database.constants';
import type { StorageDataMap } from '../types/databases';

export class Store<SN extends keyof StorageDataMap> implements IStore<SN> {
  private databaseConnection: IDBDatabase | null = null;

  private storageName: SN;

  constructor(databaseConnection: IDBDatabase | null, storageName: SN) {
    this.databaseConnection = databaseConnection;
    this.storageName = storageName;
  }

  getOne(key: string): Promise<StorageDataMap[SN] | null> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(this.storageName, 'readonly');
    const store = transaction.objectStore(this.storageName);

    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async* getAll(orderBy?: string, order?: Order): AsyncGenerator<StorageDataMap[SN], void, unknown> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(this.storageName, 'readonly');
    const store = transaction.objectStore(this.storageName);

    let source: IDBIndex | IDBObjectStore = store;

    if (orderBy && store.indexNames.contains(orderBy)) {
      source = store.index(orderBy);
    }

    const request = source.openCursor(null, order);

    while (true) {
      const cursor = await new Promise<IDBCursorWithValue | null>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (cursor) {
        yield cursor.value;
        cursor.continue();
      } else {
        break;
      }
    }
  }

  public put(key: string, value: StorageDataMap[SN]): Promise<void> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(this.storageName, 'readwrite');
    const store = transaction.objectStore(this.storageName);

    const request = store.put({ ...value, id: key });

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public delete(key: string): Promise<void> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    const transaction = this.databaseConnection.transaction(this.storageName, 'readwrite');
    const store = transaction.objectStore(this.storageName);

    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
