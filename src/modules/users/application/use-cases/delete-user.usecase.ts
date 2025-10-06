import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly repo: UsersRepository) {}

  async execute(params: { tenantId: string; targetUserId: string; requesterId: string; requesterRole: 'OWNER' | 'ADMIN' | 'MEMBER' }) {
    const user = await this.repo.getById(params.tenantId, params.targetUserId);
    if (!user) throw new NotFoundException('User not found');

    if (params.requesterId === params.targetUserId) {
      throw new BadRequestException('Cannot delete self');
    }

    if (user.role === 'OWNER') {
      if (params.requesterRole !== 'OWNER') {
        throw new ForbiddenException('Only OWNER can delete OWNER');
      }
      const lastOwner = await this.repo.isLastOwner(params.tenantId, user.id);
      if (lastOwner) throw new ForbiddenException('Cannot delete last OWNER');
    } else if (params.requesterRole === 'MEMBER') {
      throw new ForbiddenException('Not allowed');
    }

    await this.repo.delete(params.tenantId, params.targetUserId);
    return { deleted: true };
  }
}