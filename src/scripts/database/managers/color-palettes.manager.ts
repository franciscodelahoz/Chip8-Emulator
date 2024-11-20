import { customColorPaletteKeyId, defaultColorPaletteId } from '../../constants/chip8.constants';
import { colorPalettes } from '../../constants/color-palettes.constants';
import { database, emulatorConfigurationsKeys } from '../../constants/emulator.constants';
import type { ColorPalettes, CustomColorPalette } from '../../types/emulator';
import { DatabaseTool } from '../database';

class ColorPalettesManager {
  private colorPalettesStored: ColorPalettes = {};

  private currentSelectedPalette: string[] = [];

  private currentPaletteId: string = '';

  private databaseTool: DatabaseTool;

  constructor() {
    this.currentPaletteId = defaultColorPaletteId;

    this.databaseTool = new DatabaseTool(database.name, database.current_version);
  }

  public async initializeManager(): Promise<void> {
    await this.databaseTool.openDatabase();

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
    const customPaletteGenerator = this.databaseTool.custom_color_palettes?.getAll();

    for await (const customPalette of customPaletteGenerator) {
      this.colorPalettesStored[customPalette.id] = customPalette.colors;
    }
  }

  private getCustomPaletteKeys(): Array<[number, string]> {
    const indexedSettingsKey: Array<[number, string]> = [ ...emulatorConfigurationsKeys.palette_keys ]
      .map((key, index) => [ index, key ]);

    return indexedSettingsKey;
  }

  private async loadStoredCustomPalettes(): Promise<void> {
    const indexedSettingsKey = this.getCustomPaletteKeys();

    for (const [ index, key ] of indexedSettingsKey) {
      const storedColor = await this.databaseTool.settings?.getOne(key);

      const color = storedColor?.value ?? this.colorPalettesStored[defaultColorPaletteId][index];

      this.currentSelectedPalette[index] = color;
    }
  }

  private setCurrentPaletteIdFromColors(): void {
    for (const colorPaletteId in this.colorPalettesStored) {
      const allColorsMatch = this.colorPalettesStored[colorPaletteId].every((color, index) => {
        return color === this.currentSelectedPalette[index];
      });

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

    for (const [ index, key ] of indexedSettingsKey) {
      const colorValue = { id: key, value: this.currentSelectedPalette[index] };

      await this.databaseTool.settings?.put(key, colorValue);
    }
  }

  public async setColorInPalette(index: number, color: string): Promise<void> {
    this.currentSelectedPalette[index] = color;

    const colorValue = { id: emulatorConfigurationsKeys.palette_keys[index], value: color };

    await this.databaseTool.settings?.put(emulatorConfigurationsKeys.palette_keys[index], colorValue);
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

    await this.databaseTool.custom_color_palettes?.put(paletteInfo.id, paletteInfo);
  }

  public async removeColorPalette(paletteId: string): Promise<void> {
    delete this.colorPalettesStored[paletteId];

    return this.databaseTool.custom_color_palettes?.delete(paletteId);
  }

  public async renameCurrentSelectedPalette(newName: string): Promise<void> {
    const currentPaletteName = this.getCurrentPaletteId();
    const paletteInfo = await this.databaseTool.custom_color_palettes?.getOne(currentPaletteName);

    if (paletteInfo) {
      paletteInfo.name = newName;

      await this.databaseTool.custom_color_palettes?.put(paletteInfo.id, paletteInfo);
    }
  }

  public async getCurrentPaletteInfoFromStorage(): Promise<CustomColorPalette | null> {
    const paletteId = this.getCurrentPaletteId();

    return this.databaseTool.custom_color_palettes?.getOne(paletteId);
  }

  public async getCurrentPaletteNameFromId(): Promise<string> {
    const paletteInfo = await this.databaseTool.custom_color_palettes?.getOne(this.currentPaletteId);

    return paletteInfo ? paletteInfo.name : '';
  }

  public getAllCustomPalettesStored(orderBy: string = 'created_at') {
    return this.databaseTool.custom_color_palettes?.getAll(orderBy);
  }
}

export default new ColorPalettesManager();
