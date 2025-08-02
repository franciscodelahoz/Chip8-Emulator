import { db } from '../services/database.service';
import type { EmulatorSettings } from '../constants/settings.constants';
import type { SettingsObject } from '../types/emulator';

class SettingsStorage {
  public async initializeManager(): Promise<void> {
    await db.connect();
  }

  public async setSetting<T = string>(key: EmulatorSettings, value: T): Promise<void> {
    const indexedDBValue: SettingsObject<T> = {
      id: key,
      value,
    };

    await db.store('settings', 'readwrite').put(indexedDBValue);
  }

  public async getSetting<T = string>(settingName: EmulatorSettings): Promise<T | undefined> {
    const result = await db.store('settings', 'readonly').get(settingName);

    return result?.value as T ?? undefined;
  }

  public async setMultipleSettings<T = string>(settings: Array<SettingsObject<T>>): Promise<void> {
    const transaction = db.transaction('settings', 'readwrite');
    const store = transaction.store('settings');

    const bulkPutPromises = settings.map(async (setting) => store.put(setting));

    await Promise.all(bulkPutPromises);
    await transaction.done();
  }
}

export const settingsStorage = new SettingsStorage();
