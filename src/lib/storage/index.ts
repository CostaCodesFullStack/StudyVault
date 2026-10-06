import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface StorageService {
  upload(input: { userId: string; data: Buffer; contentType: string }): Promise<{ key: string }>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class LocalStorageService implements StorageService {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Invalid storage key");
    return full;
  }
  async upload({ userId, data }: { userId: string; data: Buffer; contentType: string }) {
    const key = `${userId}/${randomUUID()}.pdf`;
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return { key };
  }
  read(key: string) { return fs.readFile(this.resolve(key)); }
  async delete(key: string) { await fs.rm(this.resolve(key), { force: true }); }
  async exists(key: string) { return fs.access(this.resolve(key)).then(() => true, () => false); }
}

let instance: StorageService | undefined;
export function getStorage(): StorageService {
  if (instance) return instance;
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider === "local") {
    instance = new LocalStorageService(process.env.STORAGE_LOCAL_PATH ?? "./storage");
    return instance;
  }
  throw new Error(`Storage provider "${provider}" ainda não implementado.`);
}
