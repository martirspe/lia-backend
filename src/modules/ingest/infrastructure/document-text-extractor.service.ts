import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import pdf from 'pdf-parse';

@Injectable()
export class DocumentTextExtractorService {
  private readonly logger = new Logger(DocumentTextExtractorService.name);

  async extract(params: { storagePath: string; mimeType?: string | null; originalName?: string | null }): Promise<{ text: string; pages?: number }> {
    const { storagePath, mimeType, originalName } = params;
    const ext = (path.extname(originalName || storagePath) || '').toLowerCase();

    if (mimeType?.includes('pdf') || ext === '.pdf') return this.extractPdf(storagePath);

    if (mimeType?.startsWith('text/') || ['.txt', '.md'].includes(ext)) {
      const buf = await fs.readFile(storagePath);
      return { text: this.normalize(buf.toString('utf8')) };
    }

    // Fallback: intenta como texto
    try {
      const buf = await fs.readFile(storagePath);
      const text = this.normalize(buf.toString('utf8'));
      if (/%PDF-/.test(text) || /\x00/.test(text)) return { text: '' };
      return { text };
    } catch {
      return { text: '' };
    }
  }

  private async extractPdf(filePath: string): Promise<{ text: string; pages: number }> {
    const data = await pdf(await fs.readFile(filePath));
    return { text: this.normalize(data.text || ''), pages: data.numpages || 0 };
    }

  private normalize(input: string): string {
    const noCtl = input.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ');
    const squashed = noCtl.replace(/[ \t]+/g, ' ').replace(/\r?\n[ \t]*/g, '\n');
    return squashed.trim();
  }
}