import { screenDimensions } from '../../constants/chip8.constants';
import { colorPalettesStorage } from '../../storage/color-palettes.storage';

export class DisplayInterface {
  private readonly canvas: HTMLCanvasElement;

  private readonly context: CanvasRenderingContext2D;

  private columns: number = screenDimensions.chip8.columns;

  private rows: number = screenDimensions.chip8.rows;

  private displayBuffers: Uint8Array[] = [];

  private planeColors: string[] = [];

  private bitPlane: number = 1;

  private xDisplayScale: number = 0;

  private yDisplayScale: number = 0;

  constructor(htmlCanvas: HTMLCanvasElement | null) {
    if (!htmlCanvas) {
      throw new Error('Unable to reach the canvas element');
    }

    this.canvas = htmlCanvas;

    const canvasContext = this.canvas.getContext('2d');

    if (!canvasContext) {
      throw new Error('Unable to reach the rendering context');
    }

    this.context = canvasContext;
    this.context.imageSmoothingEnabled = false;

    this.displayBuffers = [
      new Uint8Array(this.columns * this.rows),
      new Uint8Array(this.columns * this.rows),
    ];

    this.setCanvasAspectRatio();
    this.calculateDisplayScale();

    this.planeColors = [
      ...colorPalettesStorage.getCurrentSelectedPalette(),
    ];
  }

  setPaletteColor(index: number, color: string): void {
    this.planeColors[index] = color;
  }

  getPaletteColor(index: number): string {
    return this.planeColors[index];
  }

  setCanvasAspectRatio(): void {
    this.canvas.style.aspectRatio = `${this.columns} / ${this.rows}`;
  }

  getPlaneData(number: number): Uint8Array {
    return this.displayBuffers[number];
  }

  get getDisplayBuffers(): Uint8Array[] {
    return this.displayBuffers;
  }

  calculateDisplayScale(): void {
    const { width, height } = this.canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    const horizontalScale = Math.floor(width / this.columns) * dpr;
    const verticalScale = Math.floor(height / this.rows) * dpr;

    const optimalScale = Math.max(horizontalScale, verticalScale);

    this.xDisplayScale = optimalScale;
    this.yDisplayScale = optimalScale;

    this.canvas.width = this.xDisplayScale * this.columns;
    this.canvas.height = this.yDisplayScale * this.rows;
  }

  setResolutionMode(hiresMode: boolean): void {
    if (hiresMode) {
      this.columns = screenDimensions.schip.columns;
      this.rows = screenDimensions.schip.rows;
    } else {
      this.columns = screenDimensions.chip8.columns;
      this.rows = screenDimensions.chip8.rows;
    }

    this.setCanvasAspectRatio();
    this.calculateDisplayScale();

    this.displayBuffers = [
      new Uint8Array(this.columns * this.rows),
      new Uint8Array(this.columns * this.rows),
    ];
  }

  clearDisplayBuffer(): void {
    for (const displayBuffer of this.displayBuffers) {
      displayBuffer.fill(0);
    }
  }

  setPixel(x: number, y: number, value: number, plane: number = 0): number {
    const index = y * this.columns + x;
    const collision = this.displayBuffers[plane][index] & value;

    this.displayBuffers[plane][index] ^= value;

    return collision;
  }

  setPixelByIndex(index: number, plane: number = 0): number {
    const oldPixel = this.displayBuffers[plane][index];
    const collision = oldPixel & 1;

    this.displayBuffers[plane][index] ^= 1;

    return collision;
  }

  setActivePlane(plane: number): void {
    this.bitPlane = plane;
  }

  private getDrawColor(x: number, y: number): string {
    let colorIndex = 0;

    for (let plane = 0; plane < this.displayBuffers.length; plane += 1) {
      const index = y * this.columns + x;

      if (this.displayBuffers[plane][index]) {
        colorIndex |= 1 << plane;
      }
    }

    return this.planeColors[colorIndex];
  }

  clearCanvas(): void {
    const [ backgroundColor ] = this.planeColors;

    this.context.fillStyle = backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(): void {
    this.clearCanvas();

    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.columns; x += 1) {
        const drawColor = this.getDrawColor(x, y);

        this.context.fillStyle = drawColor;

        this.context.fillRect(
          x * this.xDisplayScale,
          y * this.yDisplayScale,
          this.xDisplayScale,
          this.yDisplayScale,
        );
      }
    }
  }

  scrollUp(n: number = 4): void {
    if (n <= 0 || !this.bitPlane) return;

    const width = this.columns;
    const height = this.rows;
    const pixelsToMove = (height - n) * width;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      const data = this.displayBuffers[plane];

      data.copyWithin(0, width * n, width * height);
      data.fill(0, pixelsToMove);
    }
  }

  scrollDown(n: number = 4): void {
    if (n <= 0 || !this.bitPlane) return;

    const width = this.columns;
    const height = this.rows;
    const pixelsToMove = (height - n) * width;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      const data = this.displayBuffers[plane];

      data.copyWithin(width * n, 0, pixelsToMove);
      data.fill(0, 0, width * n);
    }
  }

  scrollLeft(n: number = 4): void {
    if (n <= 0 || !this.bitPlane) return;

    const width = this.columns;
    const height = this.rows;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      const data = this.displayBuffers[plane];

      for (let row = 0; row < height; row += 1) {
        const start = row * width;
        const end = start + width;

        data.copyWithin(start, start + n, end);
        data.fill(0, end - n, end);
      }
    }
  }

  scrollRight(n: number = 4): void {
    if (n <= 0 || !this.bitPlane) return;

    const width = this.columns;
    const height = this.rows;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      const data = this.displayBuffers[plane];

      for (let row = 0; row < height; row += 1) {
        const start = row * width;
        const end = start + width;

        data.copyWithin(start + n, start, end - n);
        data.fill(0, start, start + n);
      }
    }
  }

  getDisplayColumns(): number {
    return this.columns;
  }

  getDisplayRows(): number {
    return this.rows;
  }
}
