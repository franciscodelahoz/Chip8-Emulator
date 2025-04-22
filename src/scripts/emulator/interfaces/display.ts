import { screenDimensions } from '../../constants/chip8.constants';
import { colorPalettesStorage } from '../../storage/color-palettes.storage';

// Shader para renderizar los píxeles del CHIP-8
const shaderCode = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
};

struct Uniforms {
  columns: u32,
  rows: u32,
  padding1: u32,
  padding2: u32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> displayData: array<u32>;
@group(0) @binding(2) var<uniform> colorPalette: array<vec4f, 4>;

@vertex
fn vertexMain(@location(0) position: vec2f,
              @location(1) texCoord: vec2f) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position, 0.0, 1.0);
  output.texCoord = texCoord;
  return output;
}

@fragment
fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
  let columns = f32(uniforms.columns);
  let rows = f32(uniforms.rows);

  let x = u32(texCoord.x * columns);
  let y = u32(texCoord.y * rows);

  // Limitar a los límites de la pantalla
  if (x >= uniforms.columns || y >= uniforms.rows) {
    return colorPalette[0]; // Color de fondo
  }

  let index = y * uniforms.columns + x;
  let pixelData = displayData[index];

  // Determinar el índice de color basado en los bits de plano
  let colorIndex = pixelData & 0x3u; // 2 bit planes máximo (0-3)
  return colorPalette[colorIndex];
}
`;

export class DisplayInterface {
  private readonly canvas: HTMLCanvasElement;

  // WebGPU resources
  private device: GPUDevice | null = null;

  private context: GPUCanvasContext | null = null;

  private pipeline: GPURenderPipeline | null = null;

  private vertexBuffer: GPUBuffer | null = null;

  private indexBuffer: GPUBuffer | null = null;

  private uniformBuffer: GPUBuffer | null = null;

  private displayBuffers: Uint8Array[] = [];

  private displayDataBuffer: GPUBuffer | null = null;

  private colorPaletteBuffer: GPUBuffer | null = null;

  private bindGroup: GPUBindGroup | null = null;

  private columns: number = screenDimensions.chip8.columns;

  private rows: number = screenDimensions.chip8.rows;

  private planeColors: string[] = [];

  private bitPlane: number = 1;

  private isWebGPUInitialized: boolean = false;

  constructor(htmlCanvas: HTMLCanvasElement | null) {
    if (!htmlCanvas) {
      throw new Error('Unable to reach the canvas element');
    }

    this.canvas = htmlCanvas;

    this.displayBuffers = [
      new Uint8Array(this.columns * this.rows),
      new Uint8Array(this.columns * this.rows),
    ];

    this.planeColors = [
      ...colorPalettesStorage.getCurrentSelectedPalette(),
    ];

    this.setCanvasAspectRatio();
    this.initWebGPU();
  }

  async initWebGPU(): Promise<void> {
    if (!navigator.gpu) {
      console.error('WebGPU in not supported in this browser');

      return;
    }

    try {
      // Solicitar adaptador
      const adapter = await navigator.gpu.requestAdapter();

      if (!adapter) {
        throw new Error('No se pudo encontrar un adaptador WebGPU');
      }

      // Solicitar dispositivo
      this.device = await adapter.requestDevice();

      // Configurar el contexto del canvas
      this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;

      if (!this.context) {
        throw new Error('No se pudo crear el contexto WebGPU');
      }

      const devicePixelRatio = window.devicePixelRatio || 1;
      const presentationSize = [
        this.canvas.clientWidth * devicePixelRatio,
        this.canvas.clientHeight * devicePixelRatio,
      ];

      this.canvas.width = presentationSize[0];
      this.canvas.height = presentationSize[1];

      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

      this.context.configure({
        device    : this.device,
        format    : presentationFormat,
        alphaMode : 'premultiplied',
      });

      await this.setupRenderResources();
      this.isWebGPUInitialized = true;
    } catch (error) {
      console.error('Error inicializando WebGPU:', error);
    }
  }

  async setupRenderResources(): Promise<void> {
    if (!this.device) return;

    // Crear shader module
    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    });

    // Crear buffers de vértices para un cuadrado que cubre toda la pantalla
    const vertices = new Float32Array([
      // posición (x, y), coordenadas de textura (u, v)
      -1, -1, 0, 1,
      1, -1, 1, 1,
      1, 1, 1, 0,
      -1, 1, 0, 0,
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size             : vertices.byteLength,
      usage            : GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation : true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    // Crear buffer de índices
    const indices = new Uint16Array([ 0, 1, 2, 0, 2, 3 ]);

    this.indexBuffer = this.device.createBuffer({
      size             : indices.byteLength,
      usage            : GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation : true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();

    // Buffer de uniforms para dimensiones
    this.uniformBuffer = this.device.createBuffer({
      size  : 4 * 4, // 4 valores de 32 bits
      usage : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Buffer para datos de visualización
    const displayDataSize = this.columns * this.rows * 4; // 1 u32 por píxel

    this.displayDataBuffer = this.device.createBuffer({
      size  : displayDataSize,
      usage : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Buffer para la paleta de colores
    this.colorPaletteBuffer = this.device.createBuffer({
      size  : 4 * 4 * 4, // 4 colores, cada uno con 4 componentes de 32 bits
      usage : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Actualizar los búferes con datos iniciales
    this.updateUniformBuffer();
    this.updateColorPaletteBuffer();

    // Crear layout de bind group
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding    : 0,
          visibility : GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
          buffer     : { type: 'uniform' },
        },
        {
          binding    : 1,
          visibility : GPUShaderStage.FRAGMENT,
          buffer     : { type: 'read-only-storage' },
        },
        {
          binding    : 2,
          visibility : GPUShaderStage.FRAGMENT,
          buffer     : { type: 'uniform' },
        },
      ],
    });

    // Crear bind group
    this.bindGroup = this.device.createBindGroup({
      layout  : bindGroupLayout,
      entries : [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: this.displayDataBuffer } },
        { binding: 2, resource: { buffer: this.colorPaletteBuffer } },
      ],
    });

    // Crear pipeline
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [ bindGroupLayout ],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout : pipelineLayout,
      vertex : {
        module     : shaderModule,
        entryPoint : 'vertexMain',
        buffers    : [ {
          arrayStride : 4 * 4, // 4 floats por vértice
          attributes  : [
            {
              shaderLocation: 0, offset: 0, format: 'float32x2',
            }, // posición
            {
              shaderLocation: 1, offset: 2 * 4, format: 'float32x2',
            }, // coord textura
          ],
        } ],
      },
      fragment: {
        module     : shaderModule,
        entryPoint : 'fragmentMain',
        targets    : [ { format: navigator.gpu.getPreferredCanvasFormat() } ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    // Renderizar frame inicial
    this.render();
  }

  updateUniformBuffer(): void {
    if (!this.device || !this.uniformBuffer) return;

    const uniformData = new Uint32Array([
      this.columns,
      this.rows,
      0, // padding
      0, // padding
    ]);

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      uniformData.buffer,
      uniformData.byteOffset,
      uniformData.byteLength,
    );
  }

  updateDisplayDataBuffer(): void {
    if (!this.device || !this.displayDataBuffer) return;

    // Combine the two display buffers into a single buffer
    const combinedData = new Uint32Array(this.columns * this.rows);

    /**
     * Value 0: No plane has active pixel → Background color
     * Value 1: Only plane 0 has active pixel → Color 1
     * Value 2: Only plane 1 has active pixel → Color 2
     * Value 3: Both planes have active pixel → Color 3
     */
    for (let i = 0; i < this.columns * this.rows; i += 1) {
      let pixelValue = 0;

      if (this.displayBuffers[0][i]) {
        pixelValue |= 1;
      }

      if (this.displayBuffers[1][i]) {
        pixelValue |= 2;
      }

      combinedData[i] = pixelValue;
    }

    this.device.queue.writeBuffer(
      this.displayDataBuffer,
      0,
      combinedData.buffer,
      combinedData.byteOffset,
      combinedData.byteLength,
    );
  }

  updateColorPaletteBuffer(): void {
    if (!this.device || !this.colorPaletteBuffer) return;

    const colorData = new Float32Array(4 * 4);

    // Convert the hex color to float values
    for (let i = 0; i < 4; i += 1) {
      const color = this.planeColors[i] || '#000000';
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;

      colorData[i * 4] = r;
      colorData[i * 4 + 1] = g;
      colorData[i * 4 + 2] = b;
      colorData[i * 4 + 3] = 1; // Alpha
    }

    this.device.queue.writeBuffer(
      this.colorPaletteBuffer,
      0,
      colorData.buffer,
      colorData.byteOffset,
      colorData.byteLength,
    );
  }

  setPaletteColor(index: number, color: string): void {
    this.planeColors[index] = color;
    this.updateColorPaletteBuffer();
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
    // Ajustar el tamaño del canvas WebGPU
    if (this.device && this.context) {
      const { width, height } = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;

      // No necesitamos escalar manualmente los píxeles como en Canvas 2D
      // WebGPU se encarga de esto a través del shader y las coordenadas de textura
    }
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

    // Actualizar recursos WebGPU para la nueva resolución
    if (this.device) {
      this.updateUniformBuffer();

      // Recrear el buffer de datos de visualización para el nuevo tamaño
      const displayDataSize = this.columns * this.rows * 4;

      this.displayDataBuffer = this.device.createBuffer({
        size  : displayDataSize,
        usage : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });

      // Actualizar bind group con el nuevo buffer
      if (this.uniformBuffer && this.colorPaletteBuffer) {
        this.bindGroup = this.device.createBindGroup({
          layout  : this.pipeline!.getBindGroupLayout(0),
          entries : [
            { binding: 0, resource: { buffer: this.uniformBuffer } },
            { binding: 1, resource: { buffer: this.displayDataBuffer } },
            { binding: 2, resource: { buffer: this.colorPaletteBuffer } },
          ],
        });
      }
    }
  }

  clearDisplayBuffer(): void {
    for (const displayBuffer of this.displayBuffers) {
      displayBuffer.fill(0);
    }

    this.updateDisplayDataBuffer();
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

  clearCanvas(): void {
    // En WebGPU esto se maneja mediante el comando de clear color durante el render
    // No se necesita una implementación específica
  }

  render(): void {
    if (!this.isWebGPUInitialized || !this.device || !this.context || !this.pipeline || !this.bindGroup) {
      return;
    }

    // Actualizar el buffer de datos de visualización antes de renderizar
    this.updateDisplayDataBuffer();

    const backgroundColor = this.planeColors[0] || '#000000';
    const r = parseInt(backgroundColor.slice(1, 3), 16) / 255;
    const g = parseInt(backgroundColor.slice(3, 5), 16) / 255;
    const b = parseInt(backgroundColor.slice(5, 7), 16) / 255;

    // Comenzar a codificar comandos para el renderizado
    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view       : this.context.getCurrentTexture().createView(),
          loadOp     : 'clear',
          clearValue : {
            r, g, b, a: 1,
          },
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer!, 'uint16');
    renderPass.drawIndexed(6); // 2 triángulos = 6 vértices
    renderPass.end();

    this.device.queue.submit([ commandEncoder.finish() ]);
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
