export type IngestSourceType = 'file' | 'url' | 'api';

export class IngestSource {
  constructor(
    public readonly type: IngestSourceType,
    public readonly tenantId: string,
    public readonly botId: string,
    public readonly identifier: string, // fileId | url | api:custom
    public readonly title?: string,
    public readonly mimeType?: string,
  ) {
    if (!tenantId) throw new Error('tenantId required');
    if (!botId) throw new Error('botId required');
    if (!identifier) throw new Error('identifier required');
  }
}

export type Chunk = {
  idx: number;
  content: string;
  title?: string | null;
  source?: string | null;
};