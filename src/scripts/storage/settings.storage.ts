import type { Chip8DatabaseSchema } from '../schemas/emulator-database.schema';
import type { Database } from '../libraries/database/database';
import type { EmulatorSettings } from '../constants/settings.constants';
import type { SettingsObject } from '../types/emulator';
import { StorageAbstract } from '../abstract/storage.abstract';

class SettingsStorage extends StorageAbstract<Database<Chip8DatabaseSchema>> {
  public initializeManager(db: Database<Chip8DatabaseSchema>): void {
    this.database = db;
  }

  public async setSetting<T = string>(key: EmulatorSettings, value: T): Promise<void> {
    this.ensureDatabaseInitialized();

    const indexedDBValue: SettingsObject<T> = {
      id: key,
      value,
    };

    await this.database.store('settings', 'readwrite').put(indexedDBValue);
  }

  public async getSetting<T = string>(settingName: EmulatorSettings): Promise<T | undefined> {
    this.ensureDatabaseInitialized();

    const result = await this.database.store('settings', 'readonly').get(settingName);

    return result?.value as T ?? undefined;
  }

  public async setMultipleSettings<T = string>(settings: Array<SettingsObject<T>>): Promise<void> {
    this.ensureDatabaseInitialized();

    const transaction = this.database.transaction('settings', 'readwrite');
    const store = transaction.store('settings');

    const bulkPutPromises = settings.map(async (setting) => store.put(setting));

    await Promise.all(bulkPutPromises);
    await transaction.done();
  }
}

export const settingsStorage = new SettingsStorage();
