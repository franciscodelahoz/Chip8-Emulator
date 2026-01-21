import { type Chip8DatabaseSchema } from '../schemas/emulator-database.schema';
import { type Database } from '../libraries/database/database';

export abstract class StorageAbstract<Schema extends Database<Chip8DatabaseSchema>> {
  protected database: Schema | null = null;

  public abstract initializeManager(db: Schema): Promise<void> | void;

  protected ensureDatabaseInitialized(): asserts this is this & { database: Schema } {
    if (!this.database || !this.database.isConnected()) {
      throw new Error('Database is not initialized.');
    }
  }
}
