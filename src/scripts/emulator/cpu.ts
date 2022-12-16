import fonts from '../utils/fonts';
import { AudioInterface } from '../interfaces/audio';
import { DisplayInterface } from '../interfaces/display';
import { KeyBoardInterface } from '../interfaces/keyboard';

export class CPU {
  private memory: Uint8Array = new Uint8Array(4096);

  private registers: Uint8Array = new Uint8Array(16);

  private stack: Uint8Array = new Uint8Array(16);

  private ST: number = 0; // Sound time register.

  private DT: number = 0; // Delay timer register.

  private I: number = 0; // Auxiliary pointer to memory.

  private SP: number = -1; // Stack pointer.

  private PC: number = 0x200; // Program counter.

  private opcode: number | null = null;

  private soundEnabled: boolean = true;

  private speed: number = 10;

  public halted: boolean = true;

  constructor(
    private readonly displayInstance: DisplayInterface,
    private readonly audioInterface: AudioInterface,
    private readonly keyboardInterface: KeyBoardInterface,
  ) {}

  private loadFont() {
    this.PC = 0x000;

    for (let byte = 0; byte < fonts.length; byte += 1) {
      this.memory[this.PC] = fonts[byte];
      this.PC += 0x001;
    }

    this.PC = 0x200;
  }

  private reset() {
    this.memory = new Uint8Array(4096);
    this.registers = new Uint8Array(16);
    this.stack = new Uint8Array(16);
    this.ST = 0;
    this.DT = 0;
    this.I = 0;
    this.SP = -1;
    this.PC = 0x200;
    this.opcode = null;

    this.halted = true;
    this.soundEnabled = true;
    this.speed = 10;

    this.displayInstance.clearDisplay();
    this.displayInstance.render();
    this.loadFont();
  }

  loadRom(fileContent: Uint8Array) {
    this.reset();
    this.halted = false;

    console.log(this.memory);

    for (let byte = 0; byte < fileContent.length; byte += 1) {
      this.memory[this.PC] = fileContent[byte];
      this.PC += 1;
    }

    this.PC = 0x200;
  }

  updateTimers() {
  }


  private halt() {
    this.halted = true;
  }

  private fetchOpcode(): number {
    return (this.memory[this.PC] << 8) | this.memory[this.PC + 1];
  }

  executeOpcode(opcode: number) {
    this.PC += 2;

    const x = (opcode & 0x0F00) >> 8;
    const y = (opcode & 0x00F0) >> 4;

    // Check The first nibble to determinate the opcode
    switch (opcode & 0xF000) {
      case 0x0000: {
        switch (opcode) {
          /**
           * 00E0 - CLS
           * Clear the display.
           */
          case 0x00E0: {
            this.displayInstance.clearDisplay();
            break;
          }

          /**
           * 00EE - RET
           * Return from a subroutine.
           * The interpreter sets the program counter to the address at the
           *  top of the stack, then subtracts 1 from the stack pointer.
           */
          case 0x00EE: {
            this.PC = this.stack[this.SP];
            this.SP -= 1;
            break;
          }

          default: break;
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
          this.PC += 2;
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
          this.PC += 2;
        }

        break;
      }

      /**
       * 5xy0 - SE Vx, Vy
       * Skip next instruction if Vx = Vy.
       * The interpreter compares register Vx to register Vy, and if they are
       *  equal, increments the program counter by 2.
       */
      case 0x5000: {
        if (this.registers[x] === this.registers[y]) {
          this.PC += 2;
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
        switch (opcode & 0xF) {
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
           *  result in Vx. A bitwise OR compares the corrseponding
           *  bits from two values, and if either bit is 1, then the same bit
           *  in the result is also 1. Otherwise, it is 0.
           */
          case 0x1: {
            this.registers[x] |= this.registers[y];
            break;
          }

          /**
           * 8xy2 - AND Vx, Vy
           * Set Vx = Vx AND Vy.
           * Performs a bitwise AND on the values of Vx and Vy, then stores
           *  the result in Vx. A bitwise AND compares the corrseponding
           *  bits from two values, and if both bits are 1, then the same
           *  bit in the result is also 1. Otherwise, it is 0.
           */
          case 0x2: {
            this.registers[x] &= this.registers[y];
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
            this.registers[0xF] = sum > 0XFF ? 1 : 0;
            this.registers[x] = sum;
            break;
          }

          /**
           * 8xy5 - SUB Vx, Vy
           * Set Vx = Vx - Vy, set VF = NOT borrow.
           * If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is
           *  subtracted from Vx, and the results stored in Vx.
           */
          case 0x5: {
            this.registers[0xF] = (this.registers[x] > this.registers[y]) ? 1 : 0;
            this.registers[x] -= this.registers[y];
            break;
          }

          /**
           * 8xy6 - SHR Vx {, Vy}
           * Set Vx = Vx SHR 1.
           * If the least-significant bit of Vx is 1, then VF is set to 1,
           *  otherwise 0. Then Vx is divided by 2.
           */
          case 0x6: {
            this.registers[0xF] = this.registers[x] & 0x01;
            this.registers[x] >>= 1;
            break;
          }

          /**
           * 8xy7 - SUBN Vx, Vy
           * Set Vx = Vy - Vx, set VF = NOT borrow.
           * If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is
           *  subtracted from Vy, and the results stored in Vx.
           */
          case 0x7: {
            this.registers[0xF] = (this.registers[y] > this.registers[x]) ? 1 : 0;
            this.registers[x] = this.registers[y] - this.registers[x];
            break;
          }

          /**
           * 8xyE - SHL Vx {, Vy}
           * Set Vx = Vx SHL 1.
           * If the most-significant bit of Vx is 1, then VF is set to 1,
           *  otherwise to 0. Then Vx is multiplied by 2.
           */
          case 0xE: {
            this.registers[0xF] = this.registers[x] & 0x80;
            this.registers[x] <<= 1;
            break;
          }

          default: break;
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
          this.PC += 2;
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
        this.PC = nnn + this.registers[0];
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
        const rnd = Math.floor(Math.random() * 0xFF);
        const kk = opcode & 0X00FF;
        this.registers[x] = rnd & kk;
        break;
      }

      /**
       * Dxyn - DRW Vx, Vy, nibble
       * Display n-byte sprite starting at memory location I at (Vx, Vy),
       *  set VF = collision.
       */
      case 0xD000: {
        const spriteWidth = 8;
        const n = (opcode & 0xF);

        this.registers[0xF] = 0;

        for (let rows = 0; rows < n; rows += 1) {
          const pixel = this.memory[this.I + rows];

          for (let columns = 0; columns < spriteWidth; columns += 1) {
            const value = pixel & (1 << (7 - columns)) ? 1 : 0;
            const xPos = (this.registers[x] + columns) % this.displayInstance.getDisplayColumns();
            const yPos = (this.registers[y] + rows) % this.displayInstance.getDisplayRows();

            const setPixel = this.displayInstance.setPixel(xPos, yPos, value);

            if (setPixel) {
              this.registers[0xF] = 1;
            }
          }
        }

        this.displayInstance.render();
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
              this.PC += 2;
            }
            break;
          }

          /**
           * ExA1 - SKNP Vx
           * Skip next instruction if key with the value of Vx is not pressed.
           */
          case 0xA1: {
            if (!this.keyboardInterface.isKeyPressed(this.registers[x])) {
              this.PC += 2;
            }
            break;
          }

          default: break;
        }

        break;
      }

      case 0xF000: {
        switch (opcode & 0x00FF) {
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
            this.halted = true;

            this.keyboardInterface.onNextKeyPressed = (key) => {
              this.registers[x] = key;
              this.halted = false;
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

            this.memory[this.I] = Math.floor(Vx / 100);
            this.memory[this.I + 1] = Math.floor((Vx % 100) / 10);
            this.memory[this.I + 2] = Math.floor(Vx & 10);

            break;
          }

          /**
           * Fx55 - LD [I], Vx
           * Store registers V0 through Vx in memory starting at location I.
           */
          case 0x55: {
            for (let registerIndex = 0; registerIndex <= x; registerIndex += 1) {
              this.memory[this.I + registerIndex] = this.registers[registerIndex];
            }
            break;
          }

          /**
           * Fx65 - LD Vx, [I]
           * Read registers V0 through Vx from memory starting at location I.
           */
          case 0x65: {
            for (let registerIndex = 0; registerIndex <= x; registerIndex += 1) {
              this.registers[registerIndex] = this.memory[this.I + registerIndex];
            }
            break;
          }

          /**
           * Set I = I + Vx.
           * The values of I and Vx are added, and the results are stored in I.
           */
          case 0x1E: {
            this.I += this.registers[x];
            break;
          }

          default: break;
        }

        break;
      }

      default:
        break;
    }
  }

  step() {
    const opcode = this.fetchOpcode();
    this.executeOpcode(opcode);
  }
}
