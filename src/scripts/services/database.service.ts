import { emulatorDatabase } from '../constants/emulator.constants';
import { Database } from '../libraries/database/database';
import type { Chip8DatabaseSchema } from '../schemas/emulator-database.schema';

export const db = new Database<Chip8DatabaseSchema>({
  database_name     : emulatorDatabase.name,
  version           : emulatorDatabase.current_version,
  onUpgradeCallback : (builder): void => {
    builder.createStore('settings', 'id');
    builder
      .createStore('custom_color_palettes', 'id')
      .createIndex('created_at', 'created_at');
  },
});
