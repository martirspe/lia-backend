import { Injectable } from '@nestjs/common';
import { RetrieveContextUseCase } from './retrieve-context.usecase';
import { ContextBuilderService } from '../services/context-builder.service';
import { OpenAIChatService } from '../../infrastructure/openai-chat.service';

@Injectable()
export class AnswerQuestionUseCase {
  constructor(
    private readonly retrieve: RetrieveContextUseCase,
    private readonly builder: ContextBuilderService,
    private readonly chat: OpenAIChatService,
  ) {}

  // Note: This UC returns the answer and metadata; persistence is done by Chat module.
  async execute(params: {
    tenantId: string;
    bot: {
      id: string;
      name: string;
      systemPrompt?: string | null;
      temperature?: number | null;
      topP?: number | null;
      ragEnabled?: boolean | null;
      ragTopK?: number | null;
      ragPromptNote?: string | null;
    };
    question: string;
    userLanguage?: string | null;
  }) {
    const topK = params.bot.ragTopK ?? 5;
    const ctx = await this.retrieve.execute({
      tenantId: params.tenantId,
      botId: params.bot.id,
      query: params.question,
      topK,
    });

    const systemPrompt = this.builder.buildSystemPrompt({
      botName: params.bot.name,
      systemPrompt: params.bot.systemPrompt,
      ragPromptNote: params.bot.ragPromptNote,
      language: params.userLanguage ?? undefined,
    });

    const userPrompt = this.builder.buildUserPrompt(
      params.question,
      ctx.items.map((i) => ({ content: i.content, title: i.title, source: i.source })),
    );

    const completion = await this.chat.complete({
      system: systemPrompt,
      user: userPrompt,
      temperature: params.bot.temperature ?? 0.7,
      topP: params.bot.topP ?? 1,
    });

    return {
      answer: completion.content,
      model: completion.model,
      tokensInput: completion.usage?.promptTokens ?? 0,
      tokensOutput: completion.usage?.completionTokens ?? 0,
      latencyMs: completion.latencyMs,
      context: ctx.items,
    };
  }
}