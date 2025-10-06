import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BotsController } from './presentation/bots.controller';
import { BotsRepository } from './infrastructure/bots.repository';
import { CreateBotUseCase } from './application/use-cases/create-bot.usecase';
import { UpdateBotUseCase } from './application/use-cases/update-bot.usecase';
import { DeleteBotUseCase } from './application/use-cases/delete-bot.usecase';
import { GetBotUseCase } from './application/use-cases/get-bot.usecase';
import { ListBotsUseCase } from './application/use-cases/list-bots.usecase';

@Module({
  imports: [AuthModule],
  controllers: [BotsController],
  providers: [
    BotsRepository,
    CreateBotUseCase,
    UpdateBotUseCase,
    DeleteBotUseCase,
    GetBotUseCase,
    ListBotsUseCase,
  ],
  exports: [BotsRepository],
})
export class BotModule {}
