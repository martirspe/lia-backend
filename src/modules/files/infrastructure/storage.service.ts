import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly rootDir: string;

  constructor(private readonly config: ConfigService) {
    this.rootDir =
      this.config.get<string>('files.dir') ||
      path.join(process.cwd(), 'storage', 'uploads');
  }

  async allocateAndSave(params: { tenantId: string; originalName: string; buffer: Buffer }) {
    const ext = path.extname(params.originalName || '').toLowerCase();
    const safeName = this.safeBaseName(params.originalName);
    const tenantDir = path.join(this.rootDir, params.tenantId);
    await fs.mkdir(tenantDir, { recursive: true });

    const uuid = randomUUID();
    const filename = `${uuid}${ext}`;
    const storagePath = path.join(tenantDir, filename);

    await fs.writeFile(storagePath, params.buffer, { flag: 'wx' });

    return { filename, storagePath, originalSafeName: safeName };
  }

  async deleteIfExists(storagePath: string) {
    try {
      await fs.unlink(storagePath);
    } catch (e: any) {
      if (e?.code !== 'ENOENT') this.logger.warn(`deleteIfExists: ${e?.message || e}`);
    }
  }

  private safeBaseName(name: string) {
    const base = path.basename(name, path.extname(name));
    return base.replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 80);
  }
}