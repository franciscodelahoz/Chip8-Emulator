import type { AudioInterface } from './interfaces/audio';
import type { DisplayInterface } from './interfaces/display';
import type { KeyBoardInterface } from './interfaces/keyboard';
import { defaultAudioFrequency } from '../constants/audio.constants';
import {
  Chip8CpuEvents,
  Chip8Quirks,
  defaultCyclesPerFrame,
  defaultFontAppearance,
  defaultMemorySize,
  defaultQuirkConfigurations,
  registersSize,
  stackSize,
} from '../constants/chip8.constants';
import { fontSets } from '../constants/fonts.constants';
import type { EmulatorFontAppearance } from '../types/emulator';

export class CPU extends EventTarget {
  private memorySize: number = defaultMemorySize;

  private romFileContent: Uint8Array | null = null;

  private memory: Uint8Array = new Uint8Array(defaultMemorySize); // Memory - Chip-8/S-Chip: 4kb (4096 bytes) - XO-CHIP: 64kb (65536 bytes)

  private registers: Uint8Array = new Uint8Array(registersSize); // Registers - (16 * 8-bit) V0 through VF; VF is a flag

  private stack: number[] = new Array(stackSize); // Stack - (16 * 16-bit)

  private ST: number = 0; // ST - Sound Timer (8-bit)

  private DT: number = 0; // DT - Delay Timer (8-bit)

  private I: number = 0; // I - Auxiliary pointer to memory (stores memory address)

  private SP: number = -1; // SP - Stack Pointer (8-bit) points at top level of stack

  private PC: number = 0x200; // Program Counter (8-bit) stores currently executing address

  private playing: boolean = false;

  private waitingForKeyPressed: boolean = false;

  private waitingKeyRegister: number = -1;

  public halted: boolean = true;

  private cyclesPerFrame: number = defaultCyclesPerFrame;

  public drawingFlag: boolean = true;

  private soundEnabled: boolean = true;

  private quirksConfigurations: Record<Chip8Quirks, boolean> = { ...defaultQuirkConfigurations };

  private flags: number[] = new Array(8); // SCHIP Flags (from V0 to V7) (HP48-specific)

  private hiresMode: boolean = false;

  private bitPlane: number = 1; // XO-CHIP: Current bit plane selection (0 to 3) for graphics operations

  private audioPatternBuffer: Uint8Array = new Uint8Array(16); // XO-CHIP: Audio pattern buffer (16 * 8-bit)

  private playingPattern: boolean = false;

  private audioPitch: number = 0; // XO-CHIP: Audio pitch (8-bit)

  private fontAppearance: EmulatorFontAppearance = defaultFontAppearance;

  private cycleCounter: number = 0;

  private isPaused: boolean = false;

  constructor(
    private readonly displayInstance: DisplayInterface,
    private readonly audioInterface: AudioInterface,
    private readonly keyboardInterface: KeyBoardInterface,
  ) {
    super();
    this.displayInstance.clearDisplayBuffer();
  }

  private loadFont(): void {
    for (let byte = 0; byte < fontSets[this.fontAppearance].length; byte += 1) {
      this.memory[byte] = fontSets[this.fontAppearance][byte];
    }
  }

  private setCPUInitialState(): void {
    this.memory.fill(0);
    this.registers.fill(0);
    this.stack.fill(0);
    this.ST = 0;
    this.DT = 0;
    this.I = 0;
    this.SP = -1;
    this.PC = 0x200;

    this.flags.fill(0);

    this.waitingForKeyPressed = false;
    this.waitingKeyRegister = -1;

    this.playing = false;
    this.drawingFlag = true;
    this.hiresMode = false;

    this.bitPlane = 1;
    this.displayInstance.setActivePlane(1);

    this.audioPatternBuffer.fill(0);
    this.playingPattern = false;
    this.audioPitch = 0;

    this.cycleCounter = 0;
    this.isPaused = false;

    this.displayInstance.setResolutionMode(this.hiresMode);

    this.displayInstance.render();
    this.keyboardInterface.reset();
    this.audioInterface.stop();

    this.loadFont();
  }

  private loadRomInMemory(): void {
    if (this.romFileContent !== null) {
      for (let byte = 0; byte < this.romFileContent.length; byte += 1) {
        this.memory[0x200 + byte] = this.romFileContent[byte];
      }
    }
  }

  loadRom(fileContent: Uint8Array): void {
    this.halted = true;
    this.romFileContent = fileContent;

    this.setCPUInitialState();
    this.loadRomInMemory();

    this.halted = false;
  }

  resetRom(): void {
    this.halted = true;

    this.setCPUInitialState();
    this.loadRomInMemory();

    this.halted = false;
  }

  private fetchOpcode(): number {
    return (this.memory[this.PC] << 8) | this.memory[this.PC + 1];
  }

  private skipNextInstruction(): void {
    const nextInstruction = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];

    /**
     * In XO-CHIP, instructions can be 4 bytes long, like "LD I, nnnn".
     * If an instruction starts with 0xF000, the program counter jumps 4 bytes; otherwise,
     * it moves 2 bytes, supporting both CHIP-8 and XO-CHIP formats.
     */
    if (nextInstruction === 0xF000) {
      this.PC += 4;
    } else {
      this.PC += 2;
    }
  }

  private executeOpcode(opcode: number): void {
    this.PC += 2;

    const x = (opcode & 0x0F00) >> 8;
    let y = (opcode & 0x00F0) >> 4;

    // Check The first nibble to determinate the opcode
    switch (opcode & 0xF000) {
      case 0x0000: {
        switch (opcode & 0x00F0) {
          /**
           * SCHIP instruction
           * Scroll the display 4 pixels to down (00C0)
           */
          case 0x00C0: {
            const n = opcode & 0xF;

            this.displayInstance.scrollDown(n);
            this.drawingFlag = true;

            return;
          }

          /**
           * SCHIP instruction
           * Scroll the display 4 pixels to up (00C1)
           */
          case 0x00D0: {
            const n = opcode & 0xF;

            this.displayInstance.scrollUp(n);
            this.drawingFlag = true;

            return;
          }
        }

        switch (opcode & 0x0FFF) {
          /**
           * 00E0 - CLS
           * Clear the display.
           */
          case 0x00E0: {
            this.displayInstance.clearDisplayBuffer();
            this.drawingFlag = true;
            break;
          }

          /**
           * 00EE - RET
           * Return from a subroutine.
           * The interpreter sets the program counter to the address at the
           * top of the stack, then subtracts 1 from the stack pointer.
           */
          case 0x00EE: {
            if (this.SP < 0) {
              this.halted = true;
              this.logError('Call stack underflow', opcode);
            }

            this.PC = this.stack[this.SP];
            this.SP -= 1;
            break;
          }

          /**
           * SCHIP instruction
           * 00FD - EXIT
           * The interpreter exits the execution of the current program.
           */
          case 0x00FD: {
            this.halted = true;
            this.dispatchEvent(new Event(Chip8CpuEvents.EXIT));
            break;
          }

          /**
           * SCHIP instruction
           * Scroll the display 4 pixels to the left (00FC)
           */
          case 0x00FC: {
            this.displayInstance.scrollLeft(4);
            this.drawingFlag = true;
            break;
          }

          /**
           * SCHIP instruction
           * Scroll the display 4 pixels to the right (00FB)
           */
          case 0x00FB: {
            this.displayInstance.scrollRight(4);
            this.drawingFlag = true;
            break;
          }

          /**
           * SCHIP instruction
           * Set the extended screen mode (00FF)
           */
          case 0x00FF: {
            this.hiresMode = true;
            this.displayInstance.setResolutionMode(true);
            break;
          }

          /**
           * SCHIP instruction
           * Disable the extended screen mode (00FE)
           */
          case 0x00FE: {
            this.hiresMode = false;
            this.displayInstance.setResolutionMode(false);
            break;
          }

          default: {
            this.halted = true;
            this.logError('Illegal instruction', opcode);
          }
        }

        break;
      }

      /**
       * 1nnn - JP addr
       * Jump to location nnn.
       * The interpreter sets the program counter to nnn.
       */
      case 0x1000: {
        const nnn = opcode & 0x0FFF;

        this.PC = nnn;
        break;
      }

      /**
       * 2nnn - CALL addr
       * Call subroutine at nnn.
       * The interpreter increments the stack pointer, then puts the current
       *  PC on the top of the stack. The PC is then set to nnn.
       */
      case 0x2000: {
        if (this.SP > (this.stack.length - 1)) {
          this.halted = true;
          this.logError('Call stack overflow', opcode);
        }

        const nnn = opcode & 0x0FFF;

        this.SP += 1;

        this.stack[this.SP] = this.PC;
        this.PC = nnn;
        break;
      }

      /**
       * 3xkk - SE Vx, byte
       * Skip next instruction if Vx = kk.
       * The interpreter compares register Vx to kk, and if they are equal,
       *  increments the program counter by 2.
       */
      case 0x3000: {
        const kk = opcode & 0x00FF;

        if (this.registers[x] === kk) {
          this.skipNextInstruction();
        }

        break;
      }

      /**
       * 4xkk - SNE Vx, byte
       * Skip next instruction if Vx != kk.
       * The interpreter compares register Vx to kk, and if they are not
       *  equal, increments the program counter by 2.
       */
      case 0x4000: {
        const kk = opcode & 0x00FF;

        if (this.registers[x] !== kk) {
          this.skipNextInstruction();
        }

        break;
      }

      /**
       * Instruction modified by X0-CHIP implementation
       * the original was (5xy0 - SE Vx, Vy) from CHIP-8
       */
      case 0x5000: {
        const n = opcode & 0x000F;

        switch (n) {
          /**
           * 5xy0 - SE Vx, Vy
           * Skip next instruction if Vx = Vy.
           * The interpreter compares register Vx to register Vy, and if they are
           *  equal, increments the program counter by 2 to skip the next instruction.
           */
          case 0x0: {
            if (this.registers[x] === this.registers[y]) {
              this.skipNextInstruction();
            }

            break;
          }

          /**
           * XO-CHIP instruction
           * 5xy2 - LD [I], Vx - Vy
           * Store registers Vx through Vy in memory starting at location I.
           * The interpreter copies the values of registers from Vx to Vy into consecutive
           * memory locations, starting at the address in I.
           */
          case 0x2: {
            const registerRange = Math.abs(x - y);

            if (x < y) {
              for (let index = 0; index <= registerRange; index += 1) {
                this.memory[this.I + index] = this.registers[x + index];
              }
            } else {
              for (let index = 0; index <= registerRange; index += 1) {
                this.memory[this.I + index] = this.registers[x - index];
              }
            }

            break;
          }

          /**
           * XO-CHIP instruction
           * 5xy3 - LD Vx - Vy, [I]
           * Read registers Vx through Vy from memory starting at location I.
           * The interpreter reads values from consecutive memory locations, starting at address I,
           * into registers Vx through Vy.
           */
          case 0x3: {
            const registerRange = Math.abs(x - y);

            if (x < y) {
              for (let index = 0; index <= registerRange; index += 1) {
                this.registers[x + index] = this.memory[this.I + index];
              }
            } else {
              for (let index = 0; index <= registerRange; index += 1) {
                this.registers[x - index] = this.memory[this.I + index];
              }
            }

            break;
          }

          default: {
            this.halted = true;
            this.logError('Illegal instruction', opcode);
          }
        }

        break;
      }

      /**
       * 6xkk - LD Vx, byte
       * Set Vx = kk.
       * The interpreter puts the value kk into register Vx.
       */
      case 0x6000: {
        const kk = opcode & 0x00FF;

        this.registers[x] = kk;
        break;
      }

      /**
       * 7xkk - ADD Vx, byte
       * Set Vx = Vx + kk.
       * Adds the value kk to the value of register Vx, then stores the
       *  result in Vx.
       */
      case 0x7000: {
        const kk = opcode & 0x00FF;

        this.registers[x] += kk;
        break;
      }

      case 0x8000: {
        switch (opcode & 0x000F) {
          /**
           * 8xy0 - LD Vx, Vy
           * Set Vx = Vy.
           * Stores the value of register Vy in register Vx.
           */
          case 0x0: {
            this.registers[x] = this.registers[y];
            break;
          }

          /**
           * 8xy1 - OR Vx, Vy
           * Set Vx = Vx OR Vy.
           * Performs a bitwise OR on the values of Vx and Vy, then stores the
           *  result in Vx. A bitwise OR compares the corresponding
           *  bits from two values, and if either bit is 1, then the same bit
           *  in the result is also 1. Otherwise, it is 0.
           */
          case 0x1: {
            this.registers[x] |= this.registers[y];

            if (this.quirksConfigurations[Chip8Quirks.VF_QUIRK]) {
              this.registers[0xF] = 0;
            }

            break;
          }

          /**
           * 8xy2 - AND Vx, Vy
           * Set Vx = Vx AND Vy.
           * Performs a bitwise AND on the values of Vx and Vy, then stores
           *  the result in Vx. A bitwise AND compares the corresponding
           *  bits from two values, and if both bits are 1, then the same
           *  bit in the result is also 1. Otherwise, it is 0.
           */
          case 0x2: {
            this.registers[x] &= this.registers[y];

            if (this.quirksConfigurations[Chip8Quirks.VF_QUIRK]) {
              this.registers[0xF] = 0;
            }

            break;
          }

          /**
           * 8xy3 - XOR Vx, Vy
           * Set Vx = Vx XOR Vy.
           * Performs a bitwise exclusive OR on the values of Vx and Vy, then
           *  stores the result in Vx. An exclusive OR compares the
           *  corresponding bits from two values, and if the bits are not
           *  both the same, then the corresponding bit in the result is set
           *  to 1. Otherwise, it is 0.
           */
          case 0x3: {
            this.registers[x] ^= this.registers[y];

            if (this.quirksConfigurations[Chip8Quirks.VF_QUIRK]) {
              this.registers[0xF] = 0;
            }

            break;
          }

          /**
           * 8xy4 - ADD Vx, Vy
           * Set Vx = Vx + Vy, set VF = carry.
           * The values of Vx and Vy are added together. If the result is
           *  greater than 8 bits (i.e., > 255,) VF is set to 1,
           *  otherwise 0. Only the lowest 8 bits of the result are kept,
           *  and stored in Vx.
           */
          case 0x4: {
            const sum = this.registers[x] + this.registers[y];

            this.registers[x] = sum & 0xFF;
            this.registers[0xF] = sum > 0xFF ? 1 : 0;

            break;
          }

          /**
           * 8xy5 - SUB Vx, Vy
           * Set Vx = Vx - Vy, set VF = NOT borrow.
           * If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is
           *  subtracted from Vx, and the results stored in Vx.
           */
          case 0x5: {
            const sub = this.registers[x] - this.registers[y];
            const carryFlag = this.registers[x] >= this.registers[y] ? 1 : 0;

            this.registers[x] = sub & 0xFF;
            this.registers[0xF] = carryFlag;

            break;
          }

          /**
           * 8xy6 - SHR Vx {, Vy}
           * Set Vx = Vx SHR 1.
           * If the least-significant bit of Vx is 1, then VF is set to 1,
           *  otherwise 0. Then Vx is divided by 2.
           */
          case 0x6: {
            if (this.quirksConfigurations[Chip8Quirks.SHIFT_QUIRK]) {
              y = x;
            }

            const shiftRight = this.registers[y] >> 1;
            const leastSignificantBit = this.registers[y] & 0x01 ? 1 : 0;

            this.registers[x] = shiftRight & 0xFF;
            this.registers[0xF] = leastSignificantBit;

            break;
          }

          /**
           * 8xy7 - SUBN Vx, Vy
           * Set Vx = Vy - Vx, set VF = NOT borrow.
           * If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is
           *  subtracted from Vy, and the results stored in Vx.
           */
          case 0x7: {
            const sub = this.registers[y] - this.registers[x];
            const carryFlag = this.registers[y] >= this.registers[x] ? 1 : 0;

            this.registers[x] = sub & 0xFF;
            this.registers[0xF] = carryFlag;

            break;
          }

          /**
           * 8xyE - SHL Vx {, Vy}
           * Set Vx = Vx SHL 1.
           * If the most-significant bit of Vx is 1, then VF is set to 1,
           *  otherwise to 0. Then Vx is multiplied by 2.
           */
          case 0xE: {
            if (this.quirksConfigurations[Chip8Quirks.SHIFT_QUIRK]) {
              y = x;
            }

            const shiftLeft = this.registers[y] << 1;
            const mostSignificantBit = (this.registers[y] >> 7) & 0x01 ? 1 : 0;

            this.registers[x] = shiftLeft & 0xFF;
            this.registers[0xF] = mostSignificantBit;

            break;
          }

          default: {
            this.halted = true;
            this.logError('Illegal instruction', opcode);
          }
        }

        break;
      }

      /**
       * 9xy0 - SNE Vx, Vy
       * Skip next instruction if Vx != Vy.
       * The values of Vx and Vy are compared, and if they are not equal, the
       *  program counter is increased by 2.
       */
      case 0x9000: {
        if (this.registers[x] !== this.registers[y]) {
          this.skipNextInstruction();
        }

        break;
      }

      /**
       * Annn - LD I, addr
       * Set I = nnn.
       * The value of register I is set to nnn.
       */
      case 0xA000: {
        const nnn = opcode & 0x0FFF;

        this.I = nnn;
        break;
      }

      /**
       * Bnnn - JP V0, addr
       * Jump to location nnn + V0.
       * The program counter is set to nnn plus the value of V0.
       */
      case 0xB000: {
        const nnn = opcode & 0x0FFF;

        if (this.quirksConfigurations[Chip8Quirks.JUMP_QUIRK]) {
          this.PC = nnn + this.registers[(nnn >> 8) & 0xF];
        } else {
          this.PC = nnn + this.registers[0];
        }

        break;
      }

      /**
       * Cxkk - RND Vx, byte
       * Set Vx = random byte AND kk.
       * The interpreter generates a random number from 0 to 255, which is
       *  then ANDed with the value kk. The results are stored in Vx. See
       *  instruction 8xy2 for more information on AND.
       */
      case 0xC000: {
        const kk = opcode & 0x00FF;
        const rnd = Math.round(Math.random() * 0xFF);

        this.registers[x] = rnd & kk;
        break;
      }

      /**
       * Dxyn - DRW Vx, Vy, nibble
       * Display n-byte sprite starting at memory location I at (Vx, Vy),
       *  set VF = collision.
       */
      case 0xD000: {
        const n = opcode & 0xF;

        const vx = this.registers[x];
        const vy = this.registers[y];

        this.registers[0xF] = 0;

        const spriteHeight = (n === 0) ? 16 : n;
        let spriteWidth = (n === 0) ? 16 : 8;

        let i = this.I;

        if (this.quirksConfigurations[Chip8Quirks.ZERO_HEIGHT_SPRITE_LORES_QUIRK]) {
          spriteWidth = 8;
        }

        const displayRows = this.displayInstance.getDisplayRows();
        const displayColumns = this.displayInstance.getDisplayColumns();

        for (let plane = 0; plane < 2; plane += 1) {
          if (!(this.bitPlane & (plane + 1))) continue;

          for (let rows = 0; rows < spriteHeight; rows += 1) {
            for (let columns = 0; columns < spriteWidth; columns += 1) {
              let pixelValue = (n === 0) ? (this.memory[i + (rows * 2) + (columns > 7 ? 1 : 0)] >> (7 - (columns % 8))) & 1 :
                (this.memory[i + rows] >> (7 - columns)) & 1;

              // Special handling for n equal to 0 when not in hires, this it's needed for HAP's Rom (I don't know why it's needed, but it is)
              if (this.quirksConfigurations[Chip8Quirks.ZERO_HEIGHT_SPRITE_LORES_QUIRK] && (n === 0 && !this.hiresMode)) {
                pixelValue = (this.memory[i + rows] >> (7 - columns)) & 1;
              }

              if (this.quirksConfigurations[Chip8Quirks.CLIP_QUIRK]) {
                if ((vx % displayColumns) + columns >= displayColumns || (vy % displayRows) + rows >= displayRows) {
                  continue;
                }
              }

              const xPixelPos = (vx + columns) % displayColumns;
              const yPixelPos = (vy + rows) % displayRows;

              const setPixel = this.displayInstance.setPixel(xPixelPos, yPixelPos, pixelValue, plane);

              if (setPixel) {
                this.registers[0xF] = 1;
              }
            }
          }

          i += (n === 0) ? 32 : n;
        }

        this.drawingFlag = true;
        break;
      }

      case 0xE000: {
        switch (opcode & 0x00FF) {
          /**
           * Ex9E - SKP Vx
           * Skip next instruction if key with the value of Vx is pressed.
           */
          case 0x9E: {
            if (this.keyboardInterface.isKeyPressed(this.registers[x])) {
              this.skipNextInstruction();
            }

            break;
          }

          /**
           * ExA1 - SKNP Vx
           * Skip next instruction if key with the value of Vx is not pressed.
           */
          case 0xA1: {
            if (!this.keyboardInterface.isKeyPressed(this.registers[x])) {
              this.skipNextInstruction();
            }

            break;
          }

          default: {
            this.halted = true;
            this.logError('Illegal instruction', opcode);
          }
        }

        break;
      }

      case 0xF000: {
        switch (opcode & 0x00FF) {
          /**
           * XO-CHIP instruction
           * LD I, nnnn (Long I)
           * Set I = 16-bit address (stored in next two bytes).
           */
          case 0x00: {
            this.I = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];
            this.PC += 2; // Move past the two bytes that form the 16-bit address

            break;
          }

          /**
           * XO-CHIP instruction
           * PLANE n
           * Set the bit plane where 0 <= n <= 3.
           */
          case 0x01: {
            this.bitPlane = x & 0x03;
            this.displayInstance.setActivePlane(this.bitPlane);
            break;
          }

          /**
           * XO-CHIP instruction
           * AUDIO
           * Store bytes starting at I in the audio pattern buffer.
           */
          case 0x02: {
            for (let i = 0; i < 16; i += 1) {
              this.audioPatternBuffer[i] = this.memory[this.I + i];
            }

            this.playingPattern = true;
            break;
          }

          /**
           * Fx07 - LD Vx, DT
           * Set Vx = delay timer value.
           */
          case 0x07: {
            this.registers[x] = this.DT;
            break;
          }

          /**
           * Fx0A - LD Vx, K
           * Wait for a key press, store the value of the key in Vx.
           */
          case 0x0A: {
            this.waitingForKeyPressed = true;
            this.waitingKeyRegister = x;

            this.keyboardInterface.onNextKeyPressed = (): void => {};

            this.keyboardInterface.onNextKeyReleased = (key): void => {
              this.waitingForKeyPressed = false;
              this.registers[this.waitingKeyRegister] = key;
            };

            break;
          }

          /**
           * Fx15 - LD DT, Vx
           * Set delay timer = Vx.
           */
          case 0x15: {
            this.DT = this.registers[x];
            break;
          }

          /**
           * Fx18 - LD ST, Vx
           * Set sound timer = Vx.
           */
          case 0x18: {
            this.ST = this.registers[x];
            break;
          }

          /**
           * Fx29 - LD F, Vx
           * Set I = location of sprite for digit Vx.
           */
          case 0x29: {
            this.I = this.registers[x] * 5;
            break;
          }

          /**
           * SCHIP instruction
           * Fx30 - LD HF, Vx
           * Set I = location of 10-byte font for digit Vx.
           */
          case 0x30: {
            this.I = this.registers[x] * 10 + 80;
            break;
          }

          /**
           * Fx33 - LD B, Vx
           * Store BCD representation of Vx in memory locations I, I+1, and I+2.
           * BCD means binary-coded decimal
           * The interpreter takes the decimal value of Vx, and places the hundreds digit
           *  in memory at location in I, the tens digit at location I+1, and the ones
           *  digit at location I+2.
           * If VX is 0xef, or 239, we want 2, 3, and 9 in I, I+1, and I+2
           */
          case 0x33: {
            const Vx = this.registers[x];

            // Get the hundreds digit and place it in I.
            this.memory[this.I] = Math.floor(Vx / 100);

            // Get tens digit and place it in I+1. Gets a value between 0 and 99, then divides by 10 to give us a value between 0 and 9.
            this.memory[this.I + 1] = Math.floor((Vx % 100) / 10);

            // Get the value of the ones (last) digit and place it in I+2. 0 through 9.
            this.memory[this.I + 2] = Math.floor(Vx % 10);

            break;
          }

          /**
           * XO-CHIP instruction
           * PITCH Vx
           * Set audio pitch to Vx.
            */
          case 0x3A: {
            this.audioPitch = this.registers[x];
            break;
          }

          /**
           * Fx55 - LD [I], Vx
           * Store registers V0 through Vx in memory starting at location I.
           */
          case 0x55: {
            if (this.I > this.memorySize - x) {
              this.halted = true;
              this.logError('Memory out of bounds.', opcode);
            }

            for (let registerIndex = 0; registerIndex <= x; registerIndex += 1) {
              this.memory[this.I + registerIndex] = this.registers[registerIndex];
            }

            if (this.quirksConfigurations[Chip8Quirks.MEMORY_QUIRK]) {
              this.I += x + 1;
            }

            break;
          }

          /**
           * Fx65 - LD Vx, [I]
           * Read registers V0 through Vx from memory starting at location I.
           */
          case 0x65: {
            if (this.I > this.memorySize - x) {
              this.halted = true;
              this.logError('Memory out of bounds', opcode);
            }

            for (let registerIndex = 0; registerIndex <= x; registerIndex += 1) {
              this.registers[registerIndex] = this.memory[this.I + registerIndex];
            }

            if (this.quirksConfigurations[Chip8Quirks.MEMORY_QUIRK]) {
              this.I += x + 1;
            }

            break;
          }

          /**
           * SCHIP instruction
           * Fx75 - LD RPL, Vx
           * Store V0 to Vx in RPL user flags for later use.
           */
          case 0x75: {
            if (x > 7) {
              this.halted = true;
              this.logError('Flag out of bounds', opcode);
            }

            for (let i = 0; i <= x; i += 1) {
              this.flags[i] = this.registers[i];
            }

            break;
          }

          /**
           * SCHIP instruction
           * Fx85 - LD Vx, RPL
           * Read V0 to Vx from RPL user flags to restore the state of registers V0 through Vx.
           */
          case 0x85: {
            if (x > 7) {
              this.halted = true;
              this.logError('Flag out of bounds', opcode);
            }

            for (let i = 0; i <= x; i += 1) {
              this.registers[i] = this.flags[i];
            }

            break;
          }

          /**
           * Set I = I + Vx.
           * The values of I and Vx are added, and the results are stored in I.
           */
          case 0x1E: {
            const sum = this.I + this.registers[x];

            this.I = sum;
            break;
          }

          default: {
            this.halted = true;
            this.logError('Illegal instruction', opcode);
          }
        }

        break;
      }

      default: {
        this.halted = true;
        this.logError('Illegal instruction', opcode);
      }
    }
  }

  private step(): void {
    const opcode = this.fetchOpcode();

    this.executeOpcode(opcode);
  }

  public cycle(): void {
    if (this.halted || this.isPaused) {
      return;
    }

    if (this.DT > 0) {
      this.DT -= 1;
    }

    if (this.ST > 0) {
      if (!this.playing && this.soundEnabled) {
        this.playing = true;
        this.audioInterface.play(defaultAudioFrequency);
      }

      this.ST -= 1;
    } else if (this.playing && this.soundEnabled) {
      this.playing = false;
      this.audioInterface.stop();
    }

    for (let i = 0; (i < this.cyclesPerFrame) && !this.waitingForKeyPressed && !this.halted && !this.isPaused; i += 1) {
      if (this.quirksConfigurations[Chip8Quirks.DISPLAY_WAIT_QUIRK] && ((this.memory[this.PC] & 0xF0) === 0xD0)) {
        i = this.cyclesPerFrame;
      }

      this.cycleCounter += 1;
      this.step();
    }

    if (this.drawingFlag) {
      this.displayInstance.render();
      this.drawingFlag = false;
    }
  }

  public getQuirkValue(quirkName: Chip8Quirks): boolean {
    return this.quirksConfigurations[quirkName];
  }

  public setQuirkValue(quirkName: Chip8Quirks, value: boolean): void {
    this.quirksConfigurations[quirkName] = value;
  }

  public getCyclesPerFrame(): number {
    return this.cyclesPerFrame;
  }

  public setCyclesPerFrame(cyclesPerFrame: number): void {
    this.cyclesPerFrame = cyclesPerFrame;
  }

  public getMemorySize(): number {
    return this.memorySize;
  }

  public setMemorySize(size: number): void {
    this.memorySize = size;
    this.memory = new Uint8Array(size);
  }

  public haltCPU(): void {
    this.halted = true;
  }

  public togglePauseState(): void {
    this.isPaused = !this.isPaused;
  }

  public getSoundState(): boolean {
    return this.soundEnabled;
  }

  public setSoundState(soundEnabled: boolean): void {
    if (!soundEnabled && this.playing) {
      this.playing = false;
      this.audioInterface.stop();
    }

    this.soundEnabled = soundEnabled;
  }

  private logError(message: string, opcode: number): void {
    console.error(`${message} @ Address 0x${(this.PC - 2).toString(16).toUpperCase()} : Opcode: 0x${opcode.toString(16).toUpperCase()}`);
    this.dumpStatus();
  }

  public dumpStatus(): void {
    console.log('%cCPU Status:', 'font-weight: bold; font-size: 12px;');
    console.log(`  PC: ${this.PC} SP: ${this.SP} I: ${this.I} DT: ${this.DT} ST: ${this.ST} Cycle count: ${this.cycleCounter}`);

    console.log('%cRegisters:', 'font-weight: bold; font-size: 12px;');

    for (const [ index, value ] of this.registers.entries()) {
      console.log(`  v${index}: 0x${value.toString(16).toUpperCase()}`);
    }

    console.log('%cStack:', 'font-weight: bold; font-size: 12px;');

    for (const [ index, value ] of this.stack.entries()) {
      console.log(`  v${index}: 0x${value.toString(16).toUpperCase()}`);
    }

    console.log('%cQuirks:', 'font-weight: bold; font-size: 12px;');

    for (const [ key, value ] of Object.entries(this.quirksConfigurations)) {
      console.log(`  ${key}: ${value}`);
    }
  }

  public setFontAppearance(fontAppearance: EmulatorFontAppearance): void {
    this.fontAppearance = fontAppearance;
    this.loadFont();
  }

  public getFontAppearance(): EmulatorFontAppearance {
    return this.fontAppearance;
  }
}
