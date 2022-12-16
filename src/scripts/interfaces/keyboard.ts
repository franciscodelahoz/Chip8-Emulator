export class KeyBoardInterface {
  private readonly keyMap: Record<number, number> = {
    49: 0x1, // 1
    50: 0x2, // 2
    51: 0x3, // 3
    52: 0xc, // 4
    81: 0x4, // Q
    87: 0x5, // W
    69: 0x6, // E
    82: 0xD, // R
    65: 0x7, // A
    83: 0x8, // S
    68: 0x9, // D
    70: 0xE, // F
    90: 0xA, // Z
    88: 0x0, // X
    67: 0xB, // C
    86: 0xF  // V
  };

  private pressedKeys: boolean[];

  public onNextKeyPressed: ((key: number) => void) | null = null;

  constructor() {
    this.pressedKeys = [];
    this.onNextKeyPressed = null;

    window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    window.addEventListener('keyup', this.onKeyUp.bind(this), false);
  }

  isKeyPressed(keyCode: number) {
    return this.pressedKeys[keyCode];
  }

  onKeyDown(event: KeyboardEvent) {
    const pressedKey = this.keyMap[event.keyCode];
    this.pressedKeys[pressedKey] = true;

    if (this.onNextKeyPressed !== null && pressedKey) {
      this.onNextKeyPressed(pressedKey);
      this.onNextKeyPressed = null;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    const pressedKey = this.keyMap[event.keyCode];
    this.pressedKeys[pressedKey] = false;
  }
}
