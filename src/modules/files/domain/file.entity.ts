export class FileEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly botId: string | null,
    public readonly filename: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly storagePath: string,
    public readonly status: 'stored' | 'processing' | 'ready' | 'error' = 'stored',
    public readonly error?: string | null,
  ) {
    if (!tenantId) throw new Error('tenantId required');
    if (!originalName?.trim()) throw new Error('originalName required');
    if (!filename?.trim()) throw new Error('filename required');
    if (!mimeType?.trim()) throw new Error('mimeType required');
    if (size <= 0) throw new Error('size must be > 0');
    if (!storagePath?.trim()) throw new Error('storagePath required');
  }

  static create(params: {
    tenantId: string;
    botId?: string | null;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
  }) {
    return new FileEntity(
      '',
      params.tenantId,
      params.botId ?? null,
      params.filename,
      params.originalName,
      params.mimeType,
      params.size,
      params.storagePath,
      'stored',
      null,
    );
  }
}