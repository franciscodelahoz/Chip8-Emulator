import {
  charHeightHires,
  charHeightSmall,
  charWidthHires,
  charWidthSmall,
  fontCharacterCount,
  fontSets,
  loresFontBytes
} from '../../../constants/fonts.constants';
import { Chip8Emulator } from '../../../emulator/emulator';
import { EmulatorFontAppearance } from '../../../types/emulator';

export class FontPreviewCanvas {
  private canvasContext: CanvasRenderingContext2D;

  private canvasWidth: number;

  private canvasHeight: number;

  private fontScale: number = 1;

  private emulatorInstance: Chip8Emulator;

  private pixelXOffset: number = 2;

  private loresPixelYOffset: number = 2;

  private hiresPixelYOffset: number = 12;

  constructor(private canvas: HTMLCanvasElement, emulatorInstance: Chip8Emulator) {
    const canvasContext = this.canvas.getContext('2d');

    if (!canvasContext) {
      throw new Error('Unable to reach the rendering context');
    }

    this.canvasContext = canvasContext;
    this.canvasContext.imageSmoothingEnabled = false;

    const canvasContainer = this.canvas.parentElement;

    this.canvasWidth = canvasContainer?.clientWidth || 0;
    this.canvasHeight = this.canvasWidth * 0.14;

    this.emulatorInstance = emulatorInstance;

    this.setCanvasDimensions();
    this.calculateFontScale();
  }

  private setCanvasDimensions() {
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    this.canvas.style.width = `${this.canvasWidth}px`;
    this.canvas.style.height = `${this.canvasHeight}px`;
  }

  private calculateFontScale() {
    const scaleX = Math.floor(this.canvasWidth / (fontCharacterCount * charWidthHires));
    const scaleY = Math.floor(this.canvasHeight / (charHeightHires + this.hiresPixelYOffset));

    this.fontScale = Math.min(scaleX, scaleY);
  }

  public clearCanvas() {
    this.canvasContext.fillStyle = this.emulatorInstance.getCurrentPalette(0);
    this.canvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private isPixelSet(byte: number, xPos: number): boolean {
    return ((byte >> (7 - xPos)) & 1) === 1;
  }

  public drawCharacter(fontSet: number[], characterPosition: number, isHires: boolean) {
    const yOffset = isHires ? this.hiresPixelYOffset : this.loresPixelYOffset;

    const characterWidth = isHires ? charWidthHires : charWidthSmall;
    const characterHeight = isHires ? charHeightHires : charHeightSmall;

    const spacing = 1;

    for (let yPos = 0; yPos < characterHeight; yPos += 1) {
      const byte = fontSet[characterPosition * characterHeight + yPos];

      for (let xPos = 0; xPos < characterWidth; xPos += 1) {
        if (this.isPixelSet(byte, xPos)) {
          this.canvasContext.fillRect(
            this.fontScale * ((9 * characterPosition) + xPos + this.pixelXOffset + spacing * characterPosition),
            this.fontScale * (yPos + yOffset),
            this.fontScale,
            this.fontScale
          );
        }
      }
    }
  }

  public renderFontAppearancePreview(fontAppearance: EmulatorFontAppearance) {
    this.clearCanvas();

    this.canvasContext.fillStyle = this.emulatorInstance.getCurrentPalette(1);
    const fontData = fontSets[fontAppearance];

    const chip8LowRes = fontData.slice(0, loresFontBytes);
    const chip8HighRes = fontData.slice(loresFontBytes);

    for(let characterPosition = 0; characterPosition < fontCharacterCount; characterPosition += 1) {
      // Draw lores character
      this.drawCharacter(chip8LowRes, characterPosition, false);
      // Draw hires character
      this.drawCharacter(chip8HighRes, characterPosition, true);
    }
  }
}
