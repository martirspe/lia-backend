import { Body, Controller, HttpCode, Post, Headers, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ValidationPipe } from '../../../common/pipes/validation.pipe';
import { RetrieveContextUseCase } from '../application/use-cases/retrieve-context.usecase';
import { AnswerQuestionUseCase } from '../application/use-cases/answer-question.usecase';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

class SearchDto {
  @IsString()
  botId!: string;

  @IsString()
  query!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number = 5;
}

class AnswerDto {
  @IsString()
  conversationId!: string;

  @IsString()
  query!: string;
}

@Controller('rag')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(ValidationPipe)
export class RagController {
  constructor(
    private readonly retrieveUC: RetrieveContextUseCase,
    private readonly answerUC: AnswerQuestionUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('search')
  async search(@Headers('x-tenant-id') tenantId: string, @Body() body: SearchDto) {
    return this.retrieveUC.execute({
      tenantId,
      botId: body.botId,
      query: body.query,
      topK: body.topK ?? 5,
    });
  }

  @Post('answer')
  @HttpCode(200)
  async answer(@Headers('x-tenant-id') tenantId: string, @Body() body: AnswerDto) {
    const convo = await this.prisma.conversation.findFirst({
      where: { id: body.conversationId, tenantId },
      include: { bot: true },
    });
    if (!convo) return { error: 'Conversation not found' };

    const result = await this.answerUC.execute({
      tenantId,
      bot: {
        id: convo.botId,
        name: convo.bot.name,
        systemPrompt: convo.bot.systemPrompt,
        ragEnabled: convo.bot.ragEnabled,
        ragTopK: convo.bot.ragTopK,
        ragPromptNote: convo.bot.ragPromptNote,
        temperature: convo.bot.temperature,
        topP: convo.bot.topP,
      },
      question: body.query,
    });

    return result;
  }
}
