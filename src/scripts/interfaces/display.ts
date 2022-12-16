export class DisplayInterface {
  private canvas: HTMLCanvasElement;

  private context: CanvasRenderingContext2D;

  private readonly columns: number = 64;

  private readonly rows: number = 64;

  private readonly displayScale: number = 10;

  private displayBuffer: Array<Array<number>> = [];

  private displayWidth: number;

  private displayHeight: number;

  private foregroundColor: string;

  private pixelColor: string;

  constructor(htmlCanvas: HTMLCanvasElement | null) {
    if (!htmlCanvas) {
      throw 'Unable to reach the canvas element';
    }

    this.canvas = htmlCanvas;
    const canvasContext = this.canvas.getContext('2d');

    if (!canvasContext) {
      throw 'Unable to reach the rendering context';
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

  clearDisplay() {
    this.displayBuffer = this.createDisplayBuffer();
    this.context.fillStyle = this.foregroundColor;
    this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
  }

  setPixel(x: number, y: number, value: number) {
    const colision = this.displayBuffer[y][x] & value;
    this.displayBuffer[y][x] ^= value;
    return colision;
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

  getDisplayColumns(): number {
    return this.columns;
  }

  getDisplayRows(): number {
    return this.rows;
  }
}
