export class KeyBoardInterface {
  private readonly keyMap: Record<number, number> = {
    49 : 0x1, // 1 - 1
    50 : 0x2, // 2 - 2
    51 : 0x3, // 3 - 3
    52 : 0xC, // 4 - C
    81 : 0x4, // Q - 4
    87 : 0x5, // W - 5
    69 : 0x6, // E - 6
    82 : 0xD, // R - D
    65 : 0x7, // A - 7
    83 : 0x8, // S - 8
    68 : 0x9, // D - 9
    70 : 0xE, // F - E
    90 : 0xA, // Z - A
    88 : 0x0, // X - 0
    67 : 0xB, // C - B
    86 : 0xF, // V - F
  };

  private pressedKeys: Record<number, boolean> = {};

  public onNextKeyPressed: ((key: number) => void) | null = null;

  public onNextKeyReleased: ((key: number) => void) | null = null;

  private readonly keypadKeys: NodeListOf<HTMLElement> = document.querySelectorAll('.key');

  constructor() {
    this.pressedKeys = {};
    this.onNextKeyPressed = null;

    window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    window.addEventListener('keyup', this.onKeyUp.bind(this), false);

    this.setKeypadKeysEvents();
  }

  reset(): void {
    this.pressedKeys = {};
    this.onNextKeyPressed = null;
  }

  setKeypadKeysEvents(): void {
    this.keypadKeys.forEach((key) => {
      key.addEventListener('mousedown', (e) => {
        const keyValue = Number.parseInt(key.getAttribute('data-key-value') as string, 16);

        this.pressedKey(keyValue);
      });

      key.addEventListener('touchstart', (e) => {
        const keyValue = Number.parseInt(key.getAttribute('data-key-value') as string, 16);

        this.pressedKey(keyValue);
      }, { passive: true });

      key.addEventListener('mouseup', (e) => {
        const keyValue = Number.parseInt(key.getAttribute('data-key-value') as string, 16);

        this.releasedKey(keyValue);
      });

      key.addEventListener('touchend', (e) => {
        const keyValue = Number.parseInt(key.getAttribute('data-key-value') as string, 16);

        this.releasedKey(keyValue);
      }, { passive: true });
    });
  }

  isKeyPressed(keyCode: number): boolean {
    return this.pressedKeys[keyCode];
  }

  setKeypadKeyStatus(keyCode: number, pressed: boolean): void {
    const keypadKey = [ ...this.keypadKeys ].find((key) =>
      Number.parseInt(key.getAttribute('data-key-value') as string, 16) === keyCode);

    if (pressed) {
      keypadKey?.classList.add('active');
    } else {
      keypadKey?.classList.remove('active');
    }
  }

  pressedKey(keyValue: number): void {
    this.pressedKeys[keyValue] = true;
    this.setKeypadKeyStatus(keyValue, true);

    if (this.onNextKeyPressed !== null && keyValue !== undefined) {
      this.onNextKeyPressed(keyValue);
      this.onNextKeyPressed = null;
    }
  }

  releasedKey(keyValue: number): void {
    delete this.pressedKeys[keyValue];
    this.setKeypadKeyStatus(keyValue, false);

    if (this.onNextKeyReleased !== null && keyValue !== undefined) {
      this.onNextKeyReleased(keyValue);
      this.onNextKeyReleased = null;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const pressedKey = this.keyMap[event.keyCode];

    this.pressedKey(pressedKey);
  }

  onKeyUp(event: KeyboardEvent): void {
    const pressedKey = this.keyMap[event.keyCode];

    this.releasedKey(pressedKey);
  }

  registerKeyPressedEvent(keys: string[], callback: () => void): void {
    document.addEventListener('keydown', (event) => {
      if (keys.includes(event.key)) {
        callback();
      }
    });
  }

  private clearAllPressedKeys(): void {
    const pressedKeyValues = Object.keys(this.pressedKeys).map((k) => parseInt(k, 10));

    pressedKeyValues.forEach((keyValue) => {
      this.setKeypadKeyStatus(keyValue, false);
    });

    this.pressedKeys = {};
  }
}
