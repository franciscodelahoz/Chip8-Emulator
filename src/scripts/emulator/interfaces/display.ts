import { loresDisplayScale, screenDimensions } from '../../constants/chip8.constants';
import { colorPalettes } from '../../constants/color-palettes.constants';
import { EmulatorColorPalette } from '../../types/emulator';

export class DisplayInterface {
  private canvas: HTMLCanvasElement;

  private context: CanvasRenderingContext2D;

  private columns: number = screenDimensions.chip8.columns;

  private rows: number = screenDimensions.chip8.rows;

  private displayScale: number = loresDisplayScale;

  private displayBuffers: Array<Array<Array<number>>> = [];

  private displayWidth: number;

  private displayHeight: number;

  private planeColors: string[];

  private bitPlane: number = 1;

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

    this.displayBuffers = [
      this.createDisplayBuffer(),
      this.createDisplayBuffer(),
    ];

    this.displayWidth = this.columns * this.displayScale;
    this.displayHeight = this.rows * this.displayScale;

    this.context.canvas.width = this.displayWidth;
    this.context.canvas.height = this.displayHeight;

    this.planeColors = [ ...colorPalettes.default ];
  }

  setPaletteColor(index: number, color: string) {
    this.planeColors[index] = color;
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

    this.displayBuffers = [
      this.createDisplayBuffer(),
      this.createDisplayBuffer(),
    ];
  }

  clearDisplayBuffer() {
    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.columns; x += 1) {
          this.displayBuffers[plane][y][x] = 0;
        }
      }
    }
  }

  setPixel(plane: number = 0, x: number, y: number, value: number) {
    const collision = this.displayBuffers[plane][y][x] & value;
    this.displayBuffers[plane][y][x] ^= value;
    return collision;
  }

  setActivePlane(plane: number) {
    this.bitPlane = plane;
  }

  private getDrawColor(x: number, y: number) {
    let colorIndex = 0;

    for (let plane = 0; plane < this.displayBuffers.length; plane++) {
      if (this.displayBuffers[plane][y][x]) {
        colorIndex |= 1 << plane;
      }
    }

    return this.planeColors[colorIndex];
  }

  clearCanvas() {
    this.context.fillStyle = this.planeColors[0];
    this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
  }

  render() {
    this.clearCanvas();

    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.columns; x += 1) {
        let drawColor = this.getDrawColor(x, y);

        this.context.fillStyle = drawColor;

        this.context.fillRect(
          x * this.displayScale,
          y * this.displayScale,
          this.displayScale,
          this.displayScale,
        );
      }
    }
  }

  scrollUp(n: number = 4) {
    if (n <= 0) return;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      for (let y = 0; y < this.rows - n; y += 1) {
        this.displayBuffers[plane][y] = [ ...this.displayBuffers[plane][y + n] ];
      }

      for (let y = this.rows - n; y < this.rows; y += 1) {
        this.displayBuffers[plane][y] = new Array(this.columns).fill(0);
      }
    }
  }

  scrollDown(n: number = 4) {
    if (n <= 0) return;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      for (let y = this.rows - 1; y >= n; y -= 1) {
        this.displayBuffers[plane][y] = [ ...this.displayBuffers[plane][y - n] ];
      }

      for (let y = 0; y < n; y += 1) {
        this.displayBuffers[plane][y] = new Array(this.columns).fill(0);
      }
    }
  }

  scrollLeft(n: number = 4) {
    if (n <= 0) return;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.columns - n; x += 1) {
          this.displayBuffers[plane][y][x] = this.displayBuffers[plane][y][x + n];
        }

        for (let x = this.columns - n; x < this.columns; x += 1) {
          this.displayBuffers[plane][y][x] = 0;
        }
      }
    }
  }

  scrollRight(n: number = 4) {
    if (n <= 0) return;

    for (let plane = 0; plane < 2; plane += 1) {
      if (!(this.bitPlane & (plane + 1))) continue;

      for (let y = 0; y < this.rows; y += 1) {
        for (let x = this.columns - 1; x >= n; x -= 1) {
          this.displayBuffers[plane][y][x] = this.displayBuffers[plane][y][x - n];
        }

        for (let x = 0; x < n; x += 1) {
          this.displayBuffers[plane][y][x] = 0;
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
