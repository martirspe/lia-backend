import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIChatService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('openai.apiKey') || '';
    const baseURL =
      this.config.get<string>('openai.baseUrl') || 'https://api.openai.com/v1';
    this.model = this.config.get<string>('openai.llmModel') || 'gpt-4o-mini';
    this.client = new OpenAI({ apiKey, baseURL });
  }

  async complete(params: {
    system: string;
    user: string;
    temperature?: number;
    topP?: number;
  }): Promise<{
    content: string;
    model: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    latencyMs: number;
  }> {
    const start = Date.now();
    const res = await this.client.chat.completions.create({
      model: this.model as any,
      temperature: params.temperature ?? 0.7,
      top_p: params.topP ?? 1,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
    });

    const latencyMs = Date.now() - start;
    const choice = res.choices[0];
    const content = (choice.message.content || '').toString();
    const usage = res.usage
      ? {
          promptTokens: res.usage.prompt_tokens ?? 0,
          completionTokens: res.usage.completion_tokens ?? 0,
          totalTokens: res.usage.total_tokens ?? 0,
        }
      : undefined;

    return { content, model: res.model ?? this.model, usage, latencyMs };
  }
}