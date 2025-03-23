export function toHexString(value: number, length?: number): string {
  const hex = value.toString(16).toUpperCase();

  return `0x${length ? hex.padStart(length, '0') : hex}`;
}
