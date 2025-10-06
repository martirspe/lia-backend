import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly repo: UsersRepository) {}

  async execute(params: {
    tenantId: string;
    targetUserId: string;
    email?: string;
    name?: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
    requesterId: string;
    requesterRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  }) {
    const user = await this.repo.getById(params.tenantId, params.targetUserId);
    if (!user) throw new NotFoundException('User not found');

    const isSelf = params.requesterId === params.targetUserId;

    if (params.role) {
      if (params.role === 'OWNER' && params.requesterRole !== 'OWNER') {
        throw new ForbiddenException('Only OWNER can assign OWNER');
      }
      if (params.role === 'ADMIN' && params.requesterRole === 'MEMBER') {
        throw new ForbiddenException('Not allowed to assign ADMIN');
      }
    }

    // Prevent MEMBER editing others
    if (!isSelf && params.requesterRole === 'MEMBER') {
      throw new ForbiddenException('Not allowed');
    }

    if (params.email && params.email.toLowerCase() !== user.email.toLowerCase()) {
      const byEmail = await this.repo.getByEmail(params.email);
      if (byEmail) throw new ConflictException('Email already registered');
    }

    // If demoting/removing OWNER, ensure not last OWNER
    if (user.role === 'OWNER' && params.role && params.role !== 'OWNER') {
      const lastOwner = await this.repo.isLastOwner(params.tenantId, user.id);
      if (lastOwner) throw new ForbiddenException('Cannot demote last OWNER');
    }

    const updated = await this.repo.update(params.tenantId, params.targetUserId, {
      email: params.email?.toLowerCase(),
      name: params.name,
      role: params.role,
    });

    return { id: updated.id, email: updated.email, role: updated.role, name: updated.name };
  }
}