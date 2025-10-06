export class TenantEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly plan?: string | null,
    public readonly stripeCustomerId?: string | null,
  ) {
    if (!name?.trim()) throw new Error('Tenant name is required');
    if (!slug?.trim()) throw new Error('Tenant slug is required');
    if (!/^[a-z0-9-]{3,40}$/.test(slug))
      throw new Error('Invalid slug format');
  }

  static create(params: { name: string; slug: string; plan?: string | null }) {
    return new TenantEntity('', params.name.trim(), params.slug.trim(), params.plan ?? null, null);
  }
}