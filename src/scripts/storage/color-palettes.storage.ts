import type { Chip8DatabaseSchema } from '../schemas/emulator-database.schema';
import { colorPalettes } from '../constants/color-palettes.constants';
import { type Database } from '../libraries/database/database';
import { emulatorConfigurationsKeys } from '../constants/emulator.constants';
import { StorageAbstract } from '../abstract/storage.abstract';
import type { ColorPalettes, CustomColorPalette, SettingsObject } from '../types/emulator';
import { customColorPaletteKeyId, defaultColorPaletteId } from '../constants/chip8.constants';

class ColorPalettesStorage extends StorageAbstract<Database<Chip8DatabaseSchema>> {
  private colorPalettesStored: ColorPalettes = {};

  private currentSelectedPalette: string[] = [];

  private currentPaletteId: string = '';

  constructor() {
    super();
    this.currentPaletteId = defaultColorPaletteId;
  }

  public async initializeManager(db: Database<Chip8DatabaseSchema>): Promise<void> {
    this.database = db;

    this.loadDefaultPalettes();
    await this.loadCustomPalettes();

    this.currentSelectedPalette = [ ...this.colorPalettesStored[defaultColorPaletteId] ];
    this.currentPaletteId = defaultColorPaletteId;

    await this.loadStoredCustomPalettes();
    this.setCurrentPaletteIdFromColors();
  }

  private loadDefaultPalettes(): void {
    this.colorPalettesStored = { ...colorPalettes };
  }

  private async loadCustomPalettes(): Promise<void> {
    this.ensureDatabaseInitialized();

    const customPaletteIterator = this.database.store('custom_color_palettes').iterate();

    for await (const customPalette of customPaletteIterator) {
      this.colorPalettesStored[customPalette.id] = customPalette.colors;
    }
  }

  private getCustomPaletteKeys(): Array<[ number, string ]> {
    const indexedSettingsKey: Array<[ number, string ]> = [ ...emulatorConfigurationsKeys.palette_keys ]
      .map((key, index) => [ index, key ]);

    return indexedSettingsKey;
  }

  private async loadStoredCustomPalettes(): Promise<void> {
    this.ensureDatabaseInitialized();

    const indexedSettingsKey = this.getCustomPaletteKeys();

    const transaction = this.database.transaction('settings', 'readonly');
    const settingsTable = transaction.store('settings');

    const colorPromises = indexedSettingsKey.map(async ([ index, key ]) => {
      const storedColor = await settingsTable.get(key) as SettingsObject<string> | undefined;
      const color = storedColor?.value || this.colorPalettesStored[defaultColorPaletteId][index];

      return { index, color };
    });

    const results = await Promise.all(colorPromises);

    for (const { index, color } of results) {
      this.currentSelectedPalette[index] = color;
    }

    await transaction.done();
  }

  private setCurrentPaletteIdFromColors(): void {
    for (const colorPaletteId in this.colorPalettesStored) {
      const allColorsMatch = this.colorPalettesStored[colorPaletteId].every((color, index) =>
        color === this.currentSelectedPalette[index]);

      if (allColorsMatch) {
        this.currentPaletteId = colorPaletteId;
        break;
      }

      this.currentPaletteId = customColorPaletteKeyId;
    }
  }

  public async setSelectedPaletteByPaletteId(paletteId: string): Promise<void> {
    this.ensureDatabaseInitialized();

    this.currentSelectedPalette = [ ...this.colorPalettesStored[paletteId] ];
    this.currentPaletteId = paletteId;

    const indexedSettingsKey = this.getCustomPaletteKeys();

    const transaction = this.database.transaction('settings', 'readwrite');
    const settingsTable = transaction.store('settings');

    const bulkPutPromises = indexedSettingsKey.map(async ([ index, key ]) => {
      const colorValue = this.colorPalettesStored[paletteId][index];

      return settingsTable.put({ id: key, value: colorValue });
    });

    await Promise.all(bulkPutPromises);
    await transaction.done();
  }

  public async setColorInPalette(index: number, color: string): Promise<void> {
    this.ensureDatabaseInitialized();
    this.currentSelectedPalette[index] = color;

    await this.database.store('settings', 'readwrite').put({
      id    : emulatorConfigurationsKeys.palette_keys[index],
      value : color,
    });

    this.setCurrentPaletteIdFromColors();
  }

  public getCurrentPaletteId(): string {
    return this.currentPaletteId;
  }

  public getCurrentSelectedPalette(): string[] {
    return this.currentSelectedPalette;
  }

  public getAllColorPalettes(): ColorPalettes {
    return this.colorPalettesStored;
  }

  public getColorFromPalette(paletteId: string, index: number): string {
    return this.colorPalettesStored[paletteId][index];
  }

  public getColorPalette(paletteId: string): string[] | undefined {
    return this.colorPalettesStored[paletteId];
  }

  public async addNewColorPalette(paletteInfo: CustomColorPalette): Promise<void> {
    this.ensureDatabaseInitialized();
    this.colorPalettesStored[paletteInfo.id] = paletteInfo.colors;

    await this.database.store('custom_color_palettes', 'readwrite').put(paletteInfo);
  }

  public async removeColorPalette(paletteId: string): Promise<void> {
    this.ensureDatabaseInitialized();
    delete this.colorPalettesStored[paletteId];
    await this.database.store('custom_color_palettes', 'readwrite').delete(paletteId);
  }

  public async renameCurrentSelectedPalette(newName: string): Promise<void> {
    this.ensureDatabaseInitialized();

    const transaction = this.database.transaction('custom_color_palettes', 'readwrite');
    const store = transaction.store('custom_color_palettes');

    const currentPaletteName = this.getCurrentPaletteId();
    const paletteInfo = await store.get(currentPaletteName);

    if (paletteInfo) {
      paletteInfo.name = newName;
      await store.put(paletteInfo);
    }

    await transaction.done();
  }

  public async getCurrentPaletteInfoFromStorage(): Promise<CustomColorPalette | null> {
    this.ensureDatabaseInitialized();

    const paletteId = this.getCurrentPaletteId();
    const paletteInfo = await this.database.store('custom_color_palettes').get(paletteId);

    return paletteInfo || null;
  }

  public async getCurrentPaletteNameFromId(): Promise<string> {
    this.ensureDatabaseInitialized();

    const paletteInfo = await this.database.store('custom_color_palettes').get(this.currentPaletteId);

    return paletteInfo ? paletteInfo.name : '';
  }

  public async* getAllCustomPalettesStored(): AsyncGenerator<CustomColorPalette> {
    this.ensureDatabaseInitialized();

    const store = this.database.store('custom_color_palettes');

    yield* store.index('created_at').iterate();
  }
}

export const colorPalettesStorage = new ColorPalettesStorage();
