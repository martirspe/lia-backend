import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { BcryptService } from '../../../auth/infrastructure/bcrypt.service';

@Injectable()
export class UserProfileService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly bcrypt: BcryptService,
  ) {}

  async changePassword(params: {
    tenantId: string;
    targetUserId: string;
    requesterId: string;
    requesterRole: 'OWNER' | 'ADMIN' | 'MEMBER';
    oldPassword?: string;
    newPassword: string;
  }) {
    if (params.newPassword.length < 6) throw new BadRequestException('Password too short');

    const user = await this.repo.getById(params.tenantId, params.targetUserId);
    if (!user) throw new BadRequestException('User not found');

    const adminReset = params.requesterRole === 'OWNER' || params.requesterRole === 'ADMIN';
    const isSelf = params.requesterId === params.targetUserId;

    if (!adminReset && !isSelf) {
      throw new ForbiddenException('Not allowed');
    }

    if (!adminReset) {
      if (!params.oldPassword) throw new BadRequestException('Old password required');
      const ok = await this.bcrypt.compare(params.oldPassword, user.password);
      if (!ok) throw new BadRequestException('Old password invalid');
    }

    const hash = await this.bcrypt.hash(params.newPassword);
    await this.repo.updatePassword(params.tenantId, params.targetUserId, hash);
    return { changed: true };
  }
}