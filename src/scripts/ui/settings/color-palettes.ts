import { customColorPaletteKeyId, defaultColorPaletteId } from '../../constants/chip8.constants';
import { customPalettePrefix } from '../../constants/emulator.constants';
import ColorPalettesManager from '../../database/managers/color-palettes.manager';
import type { Chip8Emulator } from '../../emulator/emulator';
import type { CustomColorPalette, ProcessedColorValue } from '../../types/emulator';

const colorPaletteSelect = document.getElementById('color-palettes-select') as HTMLSelectElement | null;
const customPaletteGroup = colorPaletteSelect?.querySelector('optgroup[label="Custom palettes"]') as HTMLOptGroupElement | null;

const saveCustomColorPaletteBtn = document.getElementById('save-custom-color-palette') as HTMLButtonElement | null;
const deleteCustomColorPaletteBtn = document.getElementById('delete-custom-color-palette') as HTMLButtonElement | null;
const renameCustomColorPaletteBtn = document.getElementById('rename-custom-color-palette') as HTMLButtonElement | null;

const colorPaletteTable = document.getElementById('configuration-table') as HTMLTableElement | null;

function appendCustomPaletteOptionToSelect(paletteInfo: CustomColorPalette): void {
  if (!customPaletteGroup) return;

  const option = document.createElement('option');

  option.value = paletteInfo.id;
  option.innerText = paletteInfo.name;

  customPaletteGroup.appendChild(option);
}

function deleteOptionFromSelect(optionValue: string): void {
  const option = colorPaletteSelect?.querySelector(`option[value="${optionValue}"]`);

  if (option) option.remove();
}

function updateCustomPaletteOptionInSelect(paletteInfo: CustomColorPalette): void {
  const option = colorPaletteSelect?.querySelector<HTMLOptionElement>(`option[value="${paletteInfo.id}"]`);

  if (option) option.innerText = paletteInfo.name;
}

async function loadStoredCustomPalettesInSelect(): Promise<void> {
  for await (const customPalette of ColorPalettesManager.getAllCustomPalettesStored()) {
    appendCustomPaletteOptionToSelect(customPalette);
  }
}

function setInitialColorPaletteInSelect(): void {
  if (!colorPaletteSelect) return;

  const currentPaletteName = ColorPalettesManager.getCurrentPaletteId();

  colorPaletteSelect.value = currentPaletteName;
}

function setInitialColorPaletteInColorSwatch(): void {
  const colorPaletteSelected = ColorPalettesManager.getCurrentSelectedPalette();

  colorPaletteTable?.querySelectorAll(`tr`)?.forEach((element, index) => {
    const colorSwatch = element.querySelector('.color-swatch') as HTMLInputElement;
    const colorOverlay = element.querySelector('.color-overlay') as HTMLElement;

    if (colorSwatch) colorSwatch.value = colorPaletteSelected[index];

    if (colorOverlay) colorOverlay.style.backgroundColor = colorPaletteSelected[index];
  });
}

function setInitialColorPaletteInColorInputs(): void {
  const colorPaletteSelected = ColorPalettesManager.getCurrentSelectedPalette();

  colorPaletteTable?.querySelectorAll(`tr`)?.forEach((element, index) => {
    const colorInput = element.querySelector('.color-value') as HTMLInputElement;

    if (colorInput) colorInput.value = colorPaletteSelected[index];
  });
}

function setColorPaletteInEmulator(emulatorInstance: Chip8Emulator): void {
  const colorPaletteSelected = ColorPalettesManager.getCurrentSelectedPalette();

  colorPaletteSelected.forEach((value, index) => {
    emulatorInstance.setPaletteColor(index, value);
  });

  emulatorInstance.resetRom();
}

function setColorPaletteSelectEventHandler(emulatorInstance: Chip8Emulator): void {
  if (!colorPaletteSelect) return;

  colorPaletteSelect.addEventListener('change', async (event) => {
    let selectedValue = (event.target as HTMLSelectElement).value;

    const colorPalette = ColorPalettesManager.getColorPalette(selectedValue);

    if (!colorPalette) {
      selectedValue = defaultColorPaletteId;
      colorPaletteSelect.value = defaultColorPaletteId;
    }

    await ColorPalettesManager.setSelectedPaletteByPaletteId(selectedValue);

    setInitialColorPaletteInColorInputs();
    setInitialColorPaletteInColorSwatch();

    setCustomColorPalettesButtonState();
    setColorPaletteInEmulator(emulatorInstance);
  });
}

function processInputColorValue(colorInput: HTMLInputElement): ProcessedColorValue {
  let colorValue = colorInput.value.toUpperCase();

  colorValue = colorValue.replace(/[^#A-F0-9]/g, '').substring(0, 7);

  if (colorValue.length && colorValue.at(0) !== '#') {
    colorValue = `#${colorValue}`;
  }

  const validColorLengths = [ 4, 7 ]; // #FFF or #FFFFFF
  const isValidColor = validColorLengths.includes(colorValue.length);

  return {
    color_value : colorValue,
    is_valid    : isValidColor,
  };
}

function setColorInputValueEventHandler(emulatorInstance: Chip8Emulator): void {
  if (!colorPaletteTable) return;

  const colorInputs = colorPaletteTable.querySelectorAll<HTMLDivElement>(`tr .color-input-container`);

  colorInputs.forEach((container, index) => {
    const colorInput = container.querySelector('.color-value') as HTMLInputElement;

    colorInput?.addEventListener('input', async (element) => {
      const input = element.target as HTMLInputElement;
      const { color_value: colorValue, is_valid: isValidColor } = processInputColorValue(input);

      input.value = colorValue;

      if (!isValidColor) {
        container.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';

        return;
      }

      container.style.backgroundColor = '';
      await ColorPalettesManager.setColorInPalette(index, colorValue);

      setInitialColorPaletteInSelect();
      setInitialColorPaletteInColorSwatch();

      setCustomColorPalettesButtonState();
      setColorPaletteInEmulator(emulatorInstance);
    }, { passive: true });
  });
}

function setColorSwatchClickEventHandler(): void {
  if (!colorPaletteTable) return;

  const allColorSwatches = colorPaletteTable.querySelectorAll(`tr .color-swatch-container`);

  allColorSwatches.forEach((element) => {
    const colorSwatch = element.querySelector('.color-swatch') as HTMLInputElement;

    [ 'click', 'touchstart' ].forEach((eventType) => {
      element.addEventListener(eventType, () => {
        colorSwatch.focus();
        colorSwatch.click();
      }, { passive: true });
    });
  });
}

function setColorSwatchValueEventHandler(emulatorInstance: Chip8Emulator): void {
  if (!colorPaletteTable) return;

  const allColorSwatches = colorPaletteTable.querySelectorAll(`tr .color-swatch-container`);

  allColorSwatches.forEach((element, index) => {
    const colorSwatch = element.querySelector<HTMLInputElement>('.color-swatch');
    const colorOverlay = element.querySelector<HTMLElement>('.color-overlay');

    colorSwatch?.addEventListener('change', async (colorSwatchElement) => {
      const colorValue = (colorSwatchElement.target as HTMLInputElement).value.toUpperCase();

      await ColorPalettesManager.setColorInPalette(index, colorValue);

      if (colorOverlay) colorOverlay.style.backgroundColor = colorValue;

      setInitialColorPaletteInSelect();
      setInitialColorPaletteInColorInputs();

      setCustomColorPalettesButtonState();
      setColorPaletteInEmulator(emulatorInstance);
    });
  });
}

function setActionButtonState(actionButton: HTMLButtonElement | null, enable: boolean): void {
  if (actionButton) {
    actionButton.disabled = !enable;
    actionButton.style.display = enable ? 'inline-block' : 'none';
  }
}

function setCustomColorPalettesButtonState(): void {
  const colorPaletteName = ColorPalettesManager.getCurrentPaletteId();

  if (colorPaletteName === customColorPaletteKeyId) {
    setActionButtonState(saveCustomColorPaletteBtn, true);
    setActionButtonState(deleteCustomColorPaletteBtn, false);
    setActionButtonState(renameCustomColorPaletteBtn, false);

    return;
  }

  if (colorPaletteName.startsWith(customPalettePrefix)) {
    setActionButtonState(saveCustomColorPaletteBtn, false);
    setActionButtonState(deleteCustomColorPaletteBtn, true);
    setActionButtonState(renameCustomColorPaletteBtn, true);

    return;
  }

  setActionButtonState(saveCustomColorPaletteBtn, false);
  setActionButtonState(deleteCustomColorPaletteBtn, false);
  setActionButtonState(renameCustomColorPaletteBtn, false);
}

function generatePaletteId(): string {
  return `${customPalettePrefix}${Date.now()}`;
}

function generateNewCustomPaletteInfo(newPaletteName: string): CustomColorPalette | undefined {
  const paletteId = generatePaletteId();
  const paletteColors = ColorPalettesManager.getCurrentSelectedPalette();

  const paletteInformation: CustomColorPalette = {
    name       : newPaletteName,
    id         : paletteId,
    colors     : paletteColors,
    created_at : Date.now(),
  };

  return paletteInformation;
}

async function saveCurrentCustomPaletteAsANewPalette(paletteInfo: CustomColorPalette): Promise<void> {
  await ColorPalettesManager.addNewColorPalette(paletteInfo);
  await ColorPalettesManager.setSelectedPaletteByPaletteId(paletteInfo.id);

  appendCustomPaletteOptionToSelect(paletteInfo);
}

function setSaveCustomColorPaletteButtonEventHandler(): void {
  if (!saveCustomColorPaletteBtn) return;

  saveCustomColorPaletteBtn.addEventListener('click', async () => {
    const currentPaletteName = ColorPalettesManager.getCurrentPaletteId();

    if (currentPaletteName !== customColorPaletteKeyId) return;

    const paletteName = prompt('Enter a name for the custom color palette');

    if (!paletteName) {
      alert('Please enter a name for the custom color palette');

      return;
    }

    const palette = generateNewCustomPaletteInfo(paletteName);

    if (palette) {
      await saveCurrentCustomPaletteAsANewPalette(palette);
    }

    setInitialColorPaletteInSelect();
    setCustomColorPalettesButtonState();
  }, { passive: true });
}

function setDeleteCustomColorPaletteButtonEventHandler(emulatorInstance: Chip8Emulator): void {
  if (!deleteCustomColorPaletteBtn) return;

  deleteCustomColorPaletteBtn.addEventListener('click', async () => {
    const selectedPalette = colorPaletteSelect?.value;

    if (!selectedPalette?.includes(customPalettePrefix) || !colorPaletteSelect) {
      return;
    }

    if (!confirm('Are you sure you want to delete this custom color palette?')) return;

    deleteOptionFromSelect(selectedPalette);

    await ColorPalettesManager.removeColorPalette(selectedPalette);
    await ColorPalettesManager.setSelectedPaletteByPaletteId(defaultColorPaletteId);

    setInitialColorPaletteInSelect();
    setInitialColorPaletteInColorInputs();
    setInitialColorPaletteInColorSwatch();

    setCustomColorPalettesButtonState();

    setColorPaletteInEmulator(emulatorInstance);
  }, { passive: true });
}

function setRenameCustomPaletteButtonEventHandler(): void {
  if (!renameCustomColorPaletteBtn) return;

  renameCustomColorPaletteBtn.addEventListener('click', async () => {
    const currentPaletteName = await ColorPalettesManager.getCurrentPaletteNameFromId();

    const newPaletteName = prompt('Enter a new name for the custom color palette', currentPaletteName);

    if (!newPaletteName) {
      alert('Please enter a name for the custom color palette');

      return;
    }

    await ColorPalettesManager.renameCurrentSelectedPalette(newPaletteName);

    const storedCustomPalette = await ColorPalettesManager.getCurrentPaletteInfoFromStorage();

    if (storedCustomPalette) {
      updateCustomPaletteOptionInSelect(storedCustomPalette);
    }
  }, { passive: true });
}

export async function initializeColorPaletteSettingsModule(emulatorInstance: Chip8Emulator): Promise<void> {
  await loadStoredCustomPalettesInSelect();

  setColorPaletteInEmulator(emulatorInstance);

  setInitialColorPaletteInSelect();
  setInitialColorPaletteInColorSwatch();
  setInitialColorPaletteInColorInputs();

  setCustomColorPalettesButtonState();

  setColorSwatchClickEventHandler();
  setRenameCustomPaletteButtonEventHandler();
  setSaveCustomColorPaletteButtonEventHandler();
  setDeleteCustomColorPaletteButtonEventHandler(emulatorInstance);

  setColorPaletteSelectEventHandler(emulatorInstance);
  setColorInputValueEventHandler(emulatorInstance);
  setColorSwatchValueEventHandler(emulatorInstance);
}
