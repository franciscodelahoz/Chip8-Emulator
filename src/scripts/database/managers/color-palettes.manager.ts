import { customColorPaletteKeyId, defaultColorPaletteId } from '../../constants/chip8.constants';
import { colorPalettes } from '../../constants/color-palettes.constants';
import { database, emulatorConfigurationsKeys } from '../../constants/emulator.constants';
import { ColorPalettes, CustomColorPalette } from '../../types/emulator';
import { DatabaseTool } from '../database';

class ColorPalettesManager {
  private colorPalettesStored: ColorPalettes = {};

  private currentSelectedPalette: string[] = [];

  private currentPaletteId: string = '';

  private databaseTool: DatabaseTool;

  private customColorPaletteStorageName = database.storage_name.custom_color_palettes;

  private settingsStorageName = database.storage_name.settings;

  constructor() {
    this.currentPaletteId = defaultColorPaletteId;

    this.databaseTool = new DatabaseTool(
      database.name,
      database.current_version,
    );
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
    const customPaletteGenerator = this.databaseTool.getAllElementsFromDatabase(
      this.customColorPaletteStorageName
    );

    for await (const customPalette of customPaletteGenerator) {
      this.colorPalettesStored[customPalette.id] = customPalette.colors;
    }
  }

  private getCustomPaletteKeys(): [ number, string ][] {
    const indexedSettingsKey: [ number, string ][] = [ ...emulatorConfigurationsKeys.palette_keys ]
      .map((key, index) => ([ index, key ]));

    return indexedSettingsKey;
  }

  private async loadStoredCustomPalettes(): Promise<void> {
    const indexedSettingsKey = this.getCustomPaletteKeys();

    for (const [ index, key ] of indexedSettingsKey) {
      const storedColor = await this.databaseTool.getObjectFromDatabase(
        this.settingsStorageName,
        key
      );

      const color = storedColor?.value || this.colorPalettesStored[defaultColorPaletteId][index];
      this.currentSelectedPalette[index] = color;
    };
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

  public async setSelectedPaletteByPaletteId(paletteId: string): Promise<void>  {
    this.currentSelectedPalette = [ ...this.colorPalettesStored[paletteId] ];
    this.currentPaletteId = paletteId;

    const indexedSettingsKey = this.getCustomPaletteKeys();

    for (const [ index, key ] of indexedSettingsKey) {
      const colorValue = { value: this.currentSelectedPalette[index] };

      await this.databaseTool.putObjectInDatabase(
        this.settingsStorageName,
        key,
        colorValue,
      );
    };
  }

  public async setColorInPalette(index: number, color: string): Promise<void> {
    this.currentSelectedPalette[index] = color;
    const colorValue = { value: color };

    await this.databaseTool.putObjectInDatabase(
      this.settingsStorageName,
      emulatorConfigurationsKeys.palette_keys[index],
      colorValue,
    );

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

    await this.databaseTool.putObjectInDatabase(
      this.customColorPaletteStorageName,
      paletteInfo.id,
      paletteInfo
    );
  }

  public async removeColorPalette(paletteId: string): Promise<void> {
    delete this.colorPalettesStored[paletteId];

    return this.databaseTool.removeElementFromDatabase(
      this.customColorPaletteStorageName,
      paletteId
    );
  }

  public async renameCurrentSelectedPalette(newName: string): Promise<void> {
    const currentPaletteName = this.getCurrentPaletteId();
    const paletteInfo = await this.databaseTool.getObjectFromDatabase(
      this.customColorPaletteStorageName,
      currentPaletteName
    );

    if (paletteInfo) {
      paletteInfo.name = newName;

      await this.databaseTool.putObjectInDatabase(
        this.customColorPaletteStorageName,
        paletteInfo.id,
        paletteInfo
      );
    }
  }

  public async getCurrentPaletteInfoFromStorage(): Promise<CustomColorPalette | null> {
    const paletteId = this.getCurrentPaletteId();

    return this.databaseTool.getObjectFromDatabase(
      this.customColorPaletteStorageName,
      paletteId
    );
  }

  public async getCurrentPaletteNameFromId(): Promise<string> {
    const paletteInfo =  await this.databaseTool.getObjectFromDatabase(
      this.customColorPaletteStorageName,
      this.currentPaletteId
    );

    return paletteInfo ? paletteInfo.name : '';
  }

  public getAllCustomPalettesStored(orderBy: string = 'created_at') {
    return this.databaseTool.getAllElementsFromDatabase(
      this.customColorPaletteStorageName,
      orderBy,
    );
  }
}

export default new ColorPalettesManager();
