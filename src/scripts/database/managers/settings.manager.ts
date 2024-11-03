import { database } from '../../constants/emulator.constants';
import { EmulatorSettings } from '../../constants/settings.constants';
import { SettingsObject } from '../../types/settings';
import { DatabaseTool } from '../database';

class SettingsManager {
  private databaseTool: DatabaseTool<SettingsObject<unknown>>;

  private settingsStorageName = database.storage_name.settings;

  constructor() {
    this.databaseTool = new DatabaseTool<SettingsObject<unknown>>(
      database.name,
      database.current_version,
    );
  }

  public async initializeManager(): Promise<void> {
    await this.databaseTool.openDatabase();
  }

  public async setSetting<T = string>(settingName: EmulatorSettings, value: T): Promise<void> {
    const indexedDBValue: SettingsObject<T> = {
      id: settingName,
      value,
    };

    await this.databaseTool.putObjectInDatabase(
      this.settingsStorageName,
      settingName,
      indexedDBValue,
    );
  }

  public async getSetting<T = string>(settingName: EmulatorSettings): Promise<T | undefined> {
    const result = await this.databaseTool.getObjectFromDatabase(
      this.settingsStorageName,
      settingName,
    );

    if (!result) return undefined;

    return result.value as T;
  }
}

export default new SettingsManager();
