import type { StorageDataMap } from '../types/databases';

export abstract class IStore<SN extends keyof StorageDataMap> {
  abstract getAll(): AsyncGenerator<StorageDataMap[SN], void, void>;

  abstract getOne(key: string): Promise<StorageDataMap[SN] | null>;

  abstract put(key: string, value: StorageDataMap[SN]): Promise<void>;

  abstract delete(key: string): Promise<void>;
}
