import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserEntity } from '../../domain/user.entity';
import { BcryptService } from '../../../auth/infrastructure/bcrypt.service';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly repo: UsersRepository,
    private readonly bcrypt: BcryptService,
  ) {}

  async execute(params: {
    tenantId: string;
    email: string;
    password: string;
    name?: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
    requesterRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  }) {
    if (params.role && params.role === 'OWNER' && params.requesterRole !== 'OWNER') {
      throw new ForbiddenException('Only OWNER can assign OWNER role');
    }
    if (params.role === 'ADMIN' && params.requesterRole === 'MEMBER') {
      throw new ForbiddenException('Not allowed to assign ADMIN role');
    }

    const exists = await this.repo.getByEmail(params.email);
    if (exists) throw new ConflictException('Email already registered');

    const hash = await this.bcrypt.hash(params.password);
    const entity = UserEntity.create({
      tenantId: params.tenantId,
      email: params.email,
      passwordHash: hash,
      role: params.role ?? 'MEMBER',
      name: params.name ?? null,
    });

    const created = await this.repo.create(entity);
    return { id: created.id, email: created.email, role: created.role, name: created.name };
  }
}