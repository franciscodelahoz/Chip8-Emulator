export class KeyBoardInterface {
  private readonly keyMap: Record<number, number> = {
    49: 0x1, // 1 - 1
    50: 0x2, // 2 - 2
    51: 0x3, // 3 - 3
    52: 0xC, // 4 - C
    81: 0x4, // Q - 4
    87: 0x5, // W - 5
    69: 0x6, // E - 6
    82: 0xD, // R - D
    65: 0x7, // A - 7
    83: 0x8, // S - 8
    68: 0x9, // D - 9
    70: 0xE, // F - E
    90: 0xA, // Z - A
    88: 0x0, // X - 0
    67: 0xB, // C - B
    86: 0xF  // V - F
  };

  private pressedKeys: Record<number, boolean> = {};

  public onNextKeyPressed: ((key: number) => void) | null = null;

  constructor() {
    this.pressedKeys = {};
    this.onNextKeyPressed = null;

    window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    window.addEventListener('keyup', this.onKeyUp.bind(this), false);
  }

  reset() {
    this.pressedKeys = {};
    this.onNextKeyPressed = null;
  }

  isKeyPressed(keyCode: number) {
    return this.pressedKeys[keyCode];
  }

  pressedKey(keyValue: number) {
    this.pressedKeys[keyValue] = true;

    if (this.onNextKeyPressed !== null && keyValue !== undefined) {
      this.onNextKeyPressed(keyValue);
      this.onNextKeyPressed = null;
    }
  }

  releasedKey(keyValue: number) {
    this.pressedKeys[keyValue] = false;
  }

  onKeyDown(event: KeyboardEvent) {
    const pressedKey = this.keyMap[event.keyCode];
    this.pressedKey(pressedKey)
  }

  onKeyUp(event: KeyboardEvent) {
    const pressedKey = this.keyMap[event.keyCode];
    this.releasedKey(pressedKey);
  }
}
