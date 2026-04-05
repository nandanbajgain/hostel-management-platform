import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type IntentType = 'LIVE_DATA' | 'HOSTEL_FAQ' | 'COMPLAINT_ACTION' | 'GENERAL';

type KnowledgeBaseEntry = {
  id: string;
  content: string;
  embedding: string | null;
  metadata: unknown;
  createdAt: Date;
};

@Injectable()
export class ChatbotService {
  constructor(private readonly prisma: PrismaService) {}

  private embeddingModelCache: string | null = null;

  async chat(message: string, userId: string, history: ChatMessage[] = []) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chatbot is not configured. Set GEMINI_API_KEY on the server.',
      );
    }

    const intent = this.classifyIntent(message);
    let contextData = '';

    if (intent === 'LIVE_DATA') {
      contextData = await this.getLiveData(userId);
    } else if (intent === 'HOSTEL_FAQ' || intent === 'GENERAL') {
      contextData = await this.getRagContext(message);
    } else if (intent === 'COMPLAINT_ACTION') {
      contextData = await this.getComplaintContext(userId);
    }

    const systemPrompt = `You are HostelBot, a friendly and helpful AI assistant for ${
      process.env.HOSTEL_NAME || 'SAU International Hostel'
    } at South Asian University, New Delhi.

You help students with:
- Room information and allocation queries
- Hostel rules, facilities, and timings
- How to file complaints and track them
- Maintenance requests and schedules
- General campus and hostel life queries

Guidelines:
- Be warm, concise, and helpful
- If you don't know something, suggest contacting the warden at warden@sau.ac.in
- For urgent issues, suggest calling the warden's office
- Format responses clearly, use bullet points for lists
- Keep responses under 150 words unless detailed info is needed.`;

    const responseText = await this.generateGeminiResponse({
      apiKey,
      systemPrompt,
      contextData,
      message,
      history,
    });

    return {
      message: responseText,
      intent,
    };
  }

  private classifyIntent(message: string): IntentType {
    const lower = message.toLowerCase();
    const liveDataKeywords = [
      'my room',
      'my allocation',
      'my dues',
      'my fee',
      'which room',
      'am i allocated',
      'my block',
      'my floor',
    ];
    const faqKeywords = [
      'timing',
      'rule',
      'facility',
      'wifi',
      'mess',
      'laundry',
      'guest',
      'gate',
      'curfew',
      'fee structure',
      'how much',
      'when does',
    ];
    const complaintKeywords = [
      'complaint',
      'complain',
      'issue',
      'problem',
      'broken',
      'not working',
      'report',
    ];

    if (liveDataKeywords.some((keyword) => lower.includes(keyword))) {
      return 'LIVE_DATA';
    }
    if (faqKeywords.some((keyword) => lower.includes(keyword))) {
      return 'HOSTEL_FAQ';
    }
    if (complaintKeywords.some((keyword) => lower.includes(keyword))) {
      return 'COMPLAINT_ACTION';
    }
    return 'GENERAL';
  }

  private async getLiveData(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        allocation: {
          include: { room: true },
        },
      },
    });

    if (!user) {
      return 'Student data not found.';
    }

    if (!user.allocation || !user.allocation.isActive) {
      return `Student ${user.name} does not have an active room allocation.`;
    }

    const room = user.allocation.room;
    return `Student: ${user.name}. Room: ${room.number}, Block ${room.block}, Floor ${room.floor}. Amenities: ${room.amenities.join(', ')}.`;
  }

  private async searchKnowledgeBase(query: string): Promise<string> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const entries = await this.prisma.knowledgeBase.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const relevant = entries.filter((entry) =>
      keywords.some((keyword) => entry.content.toLowerCase().includes(keyword)),
    );

    return (relevant.length ? relevant : entries.slice(0, 3))
      .map((entry) => entry.content)
      .join('\n\n');
  }

  private async getComplaintContext(userId: string): Promise<string> {
    const recent = await this.prisma.complaint.findMany({
      where: { userId, isAnonymous: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { token: true, title: true, status: true, category: true },
    });

    if (recent.length === 0) {
      return 'No recent complaints found for this student.';
    }

    return `Recent complaints:\n${recent
      .map(
        (complaint) =>
          `- ${complaint.title} (${complaint.category}): ${complaint.status} [Token: ${complaint.token}]`,
      )
      .join('\n')}`;
  }

  async reindexKnowledgeBase() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chatbot is not configured. Set GEMINI_API_KEY on the server.',
      );
    }

    const entries = await this.prisma.knowledgeBase.findMany({
      orderBy: { createdAt: 'asc' },
    });

    let updated = 0;
    let skipped = 0;
    let embedError: string | null = null;
    for (const entry of entries) {
      if (entry.embedding) continue;
      try {
        const embedding = await this.embedText(apiKey, entry.content);
        await this.prisma.knowledgeBase.update({
          where: { id: entry.id },
          data: { embedding: JSON.stringify(embedding) },
        });
        updated += 1;
      } catch (error) {
        skipped += 1;
        if (!embedError) {
          embedError =
            error instanceof Error && error.message
              ? error.message
              : 'Embedding failed.';
        }
      }
    }

    return { total: entries.length, updated, skipped, embedError };
  }

  private async getRagContext(query: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return this.searchKnowledgeBase(query);
    }

    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.embedText(apiKey, query);
    } catch {
      return this.searchKnowledgeBase(query);
    }

    const entries = (await this.prisma.knowledgeBase.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        embedding: true,
        metadata: true,
        createdAt: true,
      },
    })) as KnowledgeBaseEntry[];

    const scored = entries
      .map((entry) => {
        const embedding = this.tryParseEmbedding(entry.embedding);
        if (!embedding) return null;
        return {
          entry,
          score: cosineSimilarity(queryEmbedding, embedding),
        };
      })
      .filter(Boolean) as Array<{ entry: KnowledgeBaseEntry; score: number }>;

    if (scored.length < 4) {
      // lazily embed a few newest entries, then score again
      const toEmbed = entries.filter((e) => !e.embedding).slice(0, 10);
      for (const entry of toEmbed) {
        try {
          const embedding = await this.embedText(apiKey, entry.content);
          await this.prisma.knowledgeBase.update({
            where: { id: entry.id },
            data: { embedding: JSON.stringify(embedding) },
          });
        } catch {
          // ignore and fall back to keyword/contextless answers
        }
      }

      const refreshed = (await this.prisma.knowledgeBase.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          embedding: true,
          metadata: true,
          createdAt: true,
        },
      })) as KnowledgeBaseEntry[];

      const rescored = refreshed
        .map((entry) => {
          const embedding = this.tryParseEmbedding(entry.embedding);
          if (!embedding) return null;
          return { entry, score: cosineSimilarity(queryEmbedding, embedding) };
        })
        .filter(Boolean) as Array<{ entry: KnowledgeBaseEntry; score: number }>;

      return this.formatContext(rescored);
    }

    return this.formatContext(scored);
  }

  private formatContext(
    scored: Array<{ entry: KnowledgeBaseEntry; score: number }>,
  ): string {
    const top = scored
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score >= 0.2)
      .slice(0, 4);

    if (top.length === 0) return '';

    return top
      .map(({ entry }) => {
        const title = getMetadataTitle(entry.metadata);
        return title ? `### ${title}\n${entry.content}` : entry.content;
      })
      .join('\n\n');
  }

  private tryParseEmbedding(raw: string | null): number[] | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;
      const values = parsed.filter((v) => typeof v === 'number');
      if (values.length < 10) return null;
      return values;
    } catch {
      return null;
    }
  }

  private async embedText(apiKey: string, text: string): Promise<number[]> {
    const baseUrl =
      process.env.GEMINI_API_BASE_URL?.trim() ||
      'https://generativelanguage.googleapis.com';
    const preferredModel = process.env.GEMINI_EMBED_MODEL?.trim();

    const controller = new AbortController();
    const timeoutMs = 10_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const model = await this.resolveEmbeddingModel(
        apiKey,
        baseUrl,
        preferredModel,
      );
      let res = await this.embedWithModel(
        apiKey,
        baseUrl,
        model,
        text,
        controller.signal,
      );

      if (!res.ok && res.status === 404 && preferredModel) {
        // If an explicitly configured model is invalid, try auto-detection once.
        this.embeddingModelCache = null;
        const fallbackModel = await this.resolveEmbeddingModel(
          apiKey,
          baseUrl,
          undefined,
        );
        res = await this.embedWithModel(
          apiKey,
          baseUrl,
          fallbackModel,
          text,
          controller.signal,
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new ServiceUnavailableException(
          `Embedding request failed (${res.status}): ${text || res.statusText}`,
        );
      }

      const data = (await res.json()) as {
        embedding?: { values?: number[] };
      };
      const values = data.embedding?.values;
      if (!values || !Array.isArray(values) || values.length === 0) {
        throw new ServiceUnavailableException('Embedding response was empty.');
      }
      return values;
    } finally {
      clearTimeout(timer);
    }
  }

  private async embedWithModel(
    apiKey: string,
    baseUrl: string,
    model: string,
    text: string,
    signal: AbortSignal,
  ) {
    return fetch(
      `${baseUrl}/v1beta/models/${model}:embedContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] } }),
        signal,
      },
    );
  }

  private async resolveEmbeddingModel(
    apiKey: string,
    baseUrl: string,
    preferredModel?: string,
  ): Promise<string> {
    if (preferredModel) {
      return preferredModel.replace(/^models\//, '');
    }
    if (this.embeddingModelCache) return this.embeddingModelCache;

    const controller = new AbortController();
    const timeoutMs = 10_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(
        `${baseUrl}/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        { method: 'GET', signal: controller.signal },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new ServiceUnavailableException(
          `Gemini ListModels failed (${res.status}): ${text || res.statusText}`,
        );
      }

      const data = (await res.json()) as {
        models?: Array<{
          name?: string;
          supportedGenerationMethods?: string[];
        }>;
      };

      const candidates =
        data.models
          ?.filter((m) =>
            (m.supportedGenerationMethods || []).includes('embedContent'),
          )
          .map((m) => (m.name || '').replace(/^models\//, ''))
          .filter(Boolean) || [];

      const picked =
        candidates.find((name) => name.toLowerCase().includes('embedding')) ||
        candidates[0] ||
        null;

      if (!picked) {
        throw new ServiceUnavailableException(
          'No embedding model available for this Gemini API key. RAG embeddings cannot be indexed with this key.',
        );
      }

      this.embeddingModelCache = picked;
      return picked;
    } finally {
      clearTimeout(timer);
    }
  }

  private async generateGeminiResponse({
    apiKey,
    systemPrompt,
    contextData,
    message,
    history,
  }: {
    apiKey: string;
    systemPrompt: string;
    contextData: string;
    message: string;
    history: ChatMessage[];
  }): Promise<string> {
    const baseUrl =
      process.env.GEMINI_API_BASE_URL?.trim() ||
      'https://generativelanguage.googleapis.com';
    const model = process.env.GEMINI_CHAT_MODEL?.trim() || 'gemini-1.5-flash';

    const controller = new AbortController();
    const timeoutMs = 25_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const contents = [
      ...history.slice(-6).map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      })),
      {
        role: 'user',
        parts: [
          {
            text:
              contextData && contextData.trim().length
                ? `Context (hostel knowledge + data):\n${contextData}\n\nUser message:\n${message}`
                : message,
          },
        ],
      },
    ];

    try {
      const res = await fetch(
        `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 450,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new ServiceUnavailableException(
          `Chat request failed (${res.status}): ${text || res.statusText}`,
        );
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || '')
          .join('') || '';
      return text.trim();
    } finally {
      clearTimeout(timer);
    }
  }
}

function cosineSimilarity(left: number[], right: number[]) {
  const size = Math.min(left.length, right.length);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let i = 0; i < size; i += 1) {
    const a = left[i] ?? 0;
    const b = right[i] ?? 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }
  const denom = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  if (!denom) return 0;
  return dot / denom;
}

function getMetadataTitle(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null;
  const title = (metadata as { title?: unknown }).title;
  return typeof title === 'string' && title.trim().length ? title.trim() : null;
}
