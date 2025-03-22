import type { DBSchema } from '../types/database';

export interface Chip8DatabaseSchema extends DBSchema {
  settings: {
    fields: {
      id: string;
      value: unknown;
    };
    key: 'id';
  };

  custom_color_palettes: {
    fields: {
      id: string;
      name: string;
      colors: string[];
      created_at: number;
    };
    key: 'id';
    indexes: {
      created_at: number;
      name: string;
    };
  };
}
