import type { CustomColorPalette } from './emulator';
import type { SettingsObject } from './settings';
import type { StorageName } from '../constants/emulator.constants';

export interface StorageDataMap {
  [StorageName.CustomColorPalettes]: CustomColorPalette;
  [StorageName.Settings]: SettingsObject<string>;
}

export type StorageDataType<SN extends keyof StorageDataMap, T = unknown> = SN extends StorageName.Settings
  ? SettingsObject<T>
  : StorageDataMap[SN];
