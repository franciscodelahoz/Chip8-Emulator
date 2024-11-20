import { Store } from './store';
import { StorageName, database } from '../constants/emulator.constants';

export class DatabaseTool {
  private databaseName: string;

  private databaseVersion: number;

  private databaseConnection: IDBDatabase | null = null;

  public settings: Store<StorageName.Settings> | null = null;

  public custom_color_palettes: Store<StorageName.CustomColorPalettes> | null = null;

  constructor(databaseName: string, version: number) {
    this.databaseName = databaseName;
    this.databaseVersion = version;
  }

  public async openDatabase(): Promise<void> {
    if (this.databaseConnection) return;

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.databaseVersion);

      request.onupgradeneeded = () => {
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

      request.onsuccess = () => {
        this.databaseConnection = request.result;

        this.settings = new Store<StorageName.Settings>(
          this.databaseConnection,
          StorageName.Settings,
        );

        this.custom_color_palettes = new Store<StorageName.CustomColorPalettes>(
          this.databaseConnection,
          StorageName.CustomColorPalettes,
        );

        resolve();
      };

      request.onerror = (event) => {
        const { error } = event.target as IDBRequest;

        reject(new Error(`Error opening database: ${error}`));
      };
    });
  }

  public async closeDatabase(): Promise<void> {
    if (!this.databaseConnection) {
      throw new Error('Database is not opened yet');
    }

    this.databaseConnection.close();
    this.databaseConnection = null;
  }
}
