import { screenDimensions } from '../../constants/chip8.constants';

export class DisplayInterface {
  private canvas: HTMLCanvasElement;

  private context: CanvasRenderingContext2D;

  private columns: number = screenDimensions.chip8.columns;

  private rows: number = screenDimensions.chip8.rows;

  private displayScale: number = 12;

  private displayBuffer: Array<Array<number>> = [];

  private displayWidth: number;

  private displayHeight: number;

  private foregroundColor: string;

  private pixelColor: string;

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

    this.displayBuffer = this.createDisplayBuffer();

    this.displayWidth = this.columns * this.displayScale;
    this.displayHeight = this.rows * this.displayScale;

    this.context.canvas.width = this.displayWidth;
    this.context.canvas.height = this.displayHeight;

    this.foregroundColor = '#222222';
    this.pixelColor = '#33FF66';
  }

  createDisplayBuffer() {
    const displayBuffer: Array<Array<number>>  = [];

    for (let y = 0; y < this.rows; y += 1) {
      displayBuffer.push([]);
      for (let x = 0; x < this.columns; x += 1) {
        displayBuffer[y].push(0);
      }
    }

    return displayBuffer;
  }

  setResolutionMode(hiresMode: boolean) {
    if (hiresMode) {
      this.columns = screenDimensions.schip.columns;
      this.rows = screenDimensions.schip.rows;
    } else {
      this.columns = screenDimensions.chip8.columns;
      this.rows = screenDimensions.chip8.rows;
    }

    const scaleX = this.canvas.width / this.columns;
    const scaleY = this.canvas.height / this.rows;
    this.displayScale = Math.min(scaleX, scaleY);

    this.displayBuffer = this.createDisplayBuffer();
    this.clearDisplay();
  }

  clearDisplay() {
    this.displayBuffer = this.createDisplayBuffer();
    this.context.fillStyle = this.foregroundColor;
    this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
  }

  setPixel(x: number, y: number, value: number) {
    const collision = this.displayBuffer[y][x] & value;
    this.displayBuffer[y][x] ^= value;
    return collision;
  }

  render() {
    this.context.fillStyle = this.foregroundColor;
    this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
    this.context.fillStyle = this.pixelColor;

    for (let y = 0; y < this.displayBuffer.length; y += 1) {
      for (let x = 0; x < this.displayBuffer[y].length; x += 1) {
        if (this.displayBuffer[y][x]) {
          this.context.fillRect(
            x * this.displayScale,
            y * this.displayScale,
            this.displayScale,
            this.displayScale,
          );
        }
      }
    }
  }

  scrollUp(n: number = 4) {
    if (n <= 0) return;

    for (let y = 0; y < this.rows - n; y++) {
      this.displayBuffer[y] = this.displayBuffer[y + n];
    }

    for (let y = this.rows - n; y < this.rows; y++) {
      this.displayBuffer[y] = new Array(this.columns).fill(0);
    }
  }

  scrollDown(n: number = 4) {
    if (n <= 0) return;

    for (let y = this.rows - 1; y >= n; y--) {
      this.displayBuffer[y] = this.displayBuffer[y - n];
    }

    for (let y = 0; y < n; y++) {
      this.displayBuffer[y] = new Array(this.columns).fill(0);
    }
  }

  scrollLeft(n: number = 4) {
    if (n <= 0) return;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns - n; x++) {
        this.displayBuffer[y][x] = this.displayBuffer[y][x + n];
      }

      for (let x = this.columns - n; x < this.columns; x++) {
        this.displayBuffer[y][x] = 0;
      }
    }
  }

  scrollRight(n: number = 4) {
    if (n <= 0) return;

    for (let y = 0; y < this.rows; y++) {
      for (let x = this.columns - 1; x >= n; x--) {
        this.displayBuffer[y][x] = this.displayBuffer[y][x - n];
      }

      for (let x = 0; x < n; x++) {
        this.displayBuffer[y][x] = 0;
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
