export function debounce<T extends unknown[]>(func: (...args: T) => void, wait: number) {
  let timeout: number | undefined;

  return function executedFunction(...args: T): void {
    const later = (): void => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}
