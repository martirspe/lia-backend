export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole = 'MEMBER',
    public readonly name?: string | null,
  ) {
    if (!tenantId) throw new Error('tenantId required');
    if (!email?.trim()) throw new Error('email required');
    if (!passwordHash) throw new Error('passwordHash required');
    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(role)) throw new Error('invalid role');
  }

  static create(params: { tenantId: string; email: string; passwordHash: string; role?: UserRole; name?: string | null }) {
    return new UserEntity('', params.tenantId, params.email.toLowerCase(), params.passwordHash, params.role ?? 'MEMBER', params.name ?? null);
  }
}