import { customColorPaletteKeyId, defaultColorPaletteId } from '../constants/chip8.constants';
import { colorPalettes } from '../constants/color-palettes.constants';
import { emulatorConfigurationsKeys } from '../constants/emulator.constants';
import { db } from '../services/database.service';
import type { ColorPalettes, CustomColorPalette } from '../types/emulator';

class ColorPalettesStorage {
  private colorPalettesStored: ColorPalettes = {};

  private currentSelectedPalette: string[] = [];

  private currentPaletteId: string = '';

  constructor() {
    this.currentPaletteId = defaultColorPaletteId;
  }

  public async initializeManager(): Promise<void> {
    await db.connect();

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
    const customPaletteIterator = db.store('custom_color_palettes').iterate();

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
    const indexedSettingsKey = this.getCustomPaletteKeys();

    const transaction = db.transaction('settings', 'readonly');
    const settingsTable = transaction.store('settings');

    for (const [ index, key ] of indexedSettingsKey) {
      const storedColor = await settingsTable.get(key);
      const color = storedColor?.value || this.colorPalettesStored[defaultColorPaletteId][index];

      this.currentSelectedPalette[index] = color as string;
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
    this.currentSelectedPalette = [ ...this.colorPalettesStored[paletteId] ];
    this.currentPaletteId = paletteId;

    const indexedSettingsKey = this.getCustomPaletteKeys();

    const transaction = db.transaction('settings', 'readwrite');
    const settingsTable = transaction.store('settings');

    for (const [ index, key ] of indexedSettingsKey) {
      const colorValue = this.currentSelectedPalette[index];

      await settingsTable.put({
        id    : key,
        value : colorValue,
      });
    }

    await transaction.done();
  }

  public async setColorInPalette(index: number, color: string): Promise<void> {
    this.currentSelectedPalette[index] = color;

    await db.store('settings', 'readwrite').put({
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
    this.colorPalettesStored[paletteInfo.id] = paletteInfo.colors;

    await db.store('custom_color_palettes', 'readwrite').put(paletteInfo);
  }

  public async removeColorPalette(paletteId: string): Promise<void> {
    delete this.colorPalettesStored[paletteId];
    await db.store('custom_color_palettes', 'readwrite').delete(paletteId);
  }

  public async renameCurrentSelectedPalette(newName: string): Promise<void> {
    const transaction = db.transaction('custom_color_palettes', 'readwrite');
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
    const paletteId = this.getCurrentPaletteId();
    const paletteInfo = await db.store('custom_color_palettes').get(paletteId);

    return paletteInfo || null;
  }

  public async getCurrentPaletteNameFromId(): Promise<string> {
    const paletteInfo = await db.store('custom_color_palettes').get(this.currentPaletteId);

    return paletteInfo ? paletteInfo.name : '';
  }

  public async* getAllCustomPalettesStored(): AsyncGenerator<CustomColorPalette> {
    const store = db.store('custom_color_palettes');

    yield* store.index('created_at').iterate();
  }
}

export const colorPalettesStorage = new ColorPalettesStorage();
