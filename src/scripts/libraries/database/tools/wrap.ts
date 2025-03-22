export async function wrapRequest<T>(request: IDBRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result as T));
    request.addEventListener('error', () => reject(request.error));
  });
}

export async function wrapTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
    tx.addEventListener('abort', () => reject(new Error('Transaction aborted')));
  });
}
