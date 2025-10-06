import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly repo: UsersRepository) {}

  async execute(params: { tenantId: string; id: string }) {
    const user = await this.repo.getById(params.tenantId, params.id);
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, role: user.role, name: user.name, createdAt: user.createdAt };
  }
}