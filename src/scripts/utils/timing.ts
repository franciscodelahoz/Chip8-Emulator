export function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: number | undefined;

  return function executedFunction(...args: any[]): void {
    const later = (): void => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}
