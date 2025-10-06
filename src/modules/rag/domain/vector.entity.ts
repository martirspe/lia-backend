export type VectorPayload = {
  tenantId: string;
  botId?: string | null;
  documentId: string;
  chunkIdx: number;
  title?: string | null;
  source?: string | null;
  content: string;
};

export class VectorEntity {
  constructor(
    public readonly id: string,
    public readonly vector: number[],
    public readonly payload: VectorPayload,
  ) {
    if (!vector?.length) throw new Error('Vector is required');
    if (!payload?.content?.trim()) throw new Error('Payload content required');
    if (!payload?.tenantId) throw new Error('Tenant is required');
  }
}