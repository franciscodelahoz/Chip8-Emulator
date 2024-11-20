import { database } from '../../constants/emulator.constants';
import type { EmulatorSettings } from '../../constants/settings.constants';
import type { SettingsObject } from '../../types/settings';
import { DatabaseTool } from '../database';

class SettingsManager {
  private databaseTool: DatabaseTool;

  constructor() {
    this.databaseTool = new DatabaseTool(database.name, database.current_version);
  }

  public async initializeManager(): Promise<void> {
    await this.databaseTool.openDatabase();
  }

  public async setSetting<T = string>(settingName: EmulatorSettings, value: T): Promise<void> {
    const indexedDBValue: SettingsObject<T> = {
      id: settingName,
      value,
    };

    await this.databaseTool.settings?.put(
      settingName,
      (indexedDBValue as any),
    );
  }

  public async getSetting<T = string>(settingName: EmulatorSettings): Promise<T | undefined> {
    const result = await this.databaseTool.settings?.getOne(
      settingName,
    );

    return result?.value as T ?? undefined;
  }
}

export default new SettingsManager();
