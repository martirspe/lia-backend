import { Injectable } from '@nestjs/common';

@Injectable()
export class ContextBuilderService {
  buildSystemPrompt(params: {
    botName: string;
    systemPrompt?: string | null;
    ragPromptNote?: string | null;
    language?: string | null;
  }) {
    const parts: string[] = [];
    parts.push(
      `You are "${params.botName}", a helpful and concise assistant.`,
    );
    if (params.systemPrompt) parts.push(params.systemPrompt);
    if (params.ragPromptNote)
      parts.push(`Additional rules: ${params.ragPromptNote}`);
    parts.push(
      'If context does not contain the answer, say you do not know. Answer using the user language if possible.',
    );
    if (params.language)
      parts.push(`Preferred language: ${params.language}.`);
    return parts.join('\n');
  }

  buildUserPrompt(question: string, contexts: Array<{ content: string; title?: string | null; source?: string | null }>) {
    const ctx = contexts
      .map(
        (c, i) =>
          `#${i + 1}${c.title ? ` [${c.title}]` : ''}${
            c.source ? ` (${c.source})` : ''
          }\n${c.content}`,
      )
      .join('\n\n');
    return `Context:\n${ctx}\n\nUser question:\n${question}`;
  }
}