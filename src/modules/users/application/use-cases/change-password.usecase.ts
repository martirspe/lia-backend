import { Injectable } from '@nestjs/common';
import { UserProfileService } from '../services/user-profile.service';

@Injectable()
export class ChangePasswordUseCase {
  constructor(private readonly profile: UserProfileService) {}

  execute(params: {
    tenantId: string;
    targetUserId: string;
    requesterId: string;
    requesterRole: 'OWNER' | 'ADMIN' | 'MEMBER';
    oldPassword?: string;
    newPassword: string;
  }) {
    return this.profile.changePassword(params);
  }
}