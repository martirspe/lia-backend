import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly repo: UsersRepository) {}

  async execute(params: { tenantId: string; page: number; pageSize: number; q?: string }) {
    const [items, total] = await Promise.all([
      this.repo.list(params.tenantId, params.page, params.pageSize, params.q),
      this.repo.count(params.tenantId, params.q),
    ]);
    return { items, page: params.page, pageSize: params.pageSize, total };
  }
}