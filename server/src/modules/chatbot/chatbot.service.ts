import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type IntentType = 'LIVE_DATA' | 'HOSTEL_FAQ' | 'COMPLAINT_ACTION' | 'GENERAL';

type RagSource = {
  id: string;
  title: string | null;
  type: string | null;
  score: number;
  createdAt: Date;
};

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
  private chatModelCache: string | null = null;
  private defaultsEnsured = false;

  async chat(message: string, userId: string, history: ChatMessage[] = []) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chatbot is not configured. Set GEMINI_API_KEY on the server.',
      );
    }

    const intent = this.classifyIntent(message);
    let contextData = '';
    let sources: RagSource[] = [];
    let ragTopScore: number | null = null;

    if (intent === 'LIVE_DATA') {
      contextData = await this.getLiveData(userId);
    } else if (intent === 'HOSTEL_FAQ' || intent === 'GENERAL') {
      await this.ensureDefaultsOnce();
      const rag = await this.getRagContext(message);
      contextData = rag.context;
      sources = rag.sources;
      ragTopScore = rag.topScore;
    } else if (intent === 'COMPLAINT_ACTION') {
      contextData = await this.getComplaintContext(userId);
    }

    const systemPrompt = `You are HostelBot, a friendly and helpful AI assistant for SAU Hostel.

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

    const retrievalHint =
      typeof ragTopScore === 'number'
        ? ragTopScore >= 0.22
          ? 'Retrieval confidence: HIGH'
          : ragTopScore >= 0.18
            ? 'Retrieval confidence: MEDIUM'
            : 'Retrieval confidence: LOW'
        : null;

    const responseText = await this.generateGeminiResponse({
      apiKey,
      systemPrompt,
      contextData: retrievalHint ? `${retrievalHint}\n\n${contextData}` : contextData,
      message,
      history,
    });

    return {
      message: responseText,
      intent,
      sources,
    };
  }

  async *chatStream(
    message: string,
    userId: string,
    history: ChatMessage[] = [],
  ) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chatbot is not configured. Set GEMINI_API_KEY on the server.',
      );
    }

    const intent = this.classifyIntent(message);
    let contextData = '';
    let sources: RagSource[] = [];
    let ragTopScore: number | null = null;

    if (intent === 'LIVE_DATA') {
      contextData = await this.getLiveData(userId);
    } else if (intent === 'HOSTEL_FAQ' || intent === 'GENERAL') {
      await this.ensureDefaultsOnce();
      const rag = await this.getRagContext(message);
      contextData = rag.context;
      sources = rag.sources;
      ragTopScore = rag.topScore;
    } else if (intent === 'COMPLAINT_ACTION') {
      contextData = await this.getComplaintContext(userId);
    }

    const systemPrompt = `You are HostelBot, a friendly and helpful AI assistant for SAU Hostel.

You help students with:
- Room information and allocation queries
- Hostel rules, facilities, and timings
- Mess timings and weekly mess menu
- How to file complaints and track them
- Maintenance requests and schedules
- General campus and hostel life queries

Guidelines:
- Be warm, concise, and helpful
- If you don't know something, say so and suggest contacting the warden or office
- For urgent issues, suggest calling the warden's office
- Format responses clearly, use bullet points for lists
- Keep responses under 150 words unless detailed info is needed.`;

    const retrievalHint =
      typeof ragTopScore === 'number'
        ? ragTopScore >= 0.22
          ? 'Retrieval confidence: HIGH'
          : ragTopScore >= 0.18
            ? 'Retrieval confidence: MEDIUM'
            : 'Retrieval confidence: LOW'
        : null;

    yield { type: 'meta', intent, sources };

    const textStream = this.generateGeminiResponseStream({
      apiKey,
      systemPrompt,
      contextData: retrievalHint ? `${retrievalHint}\n\n${contextData}` : contextData,
      message,
      history,
    });

    for await (const delta of textStream) {
      yield { type: 'delta', text: delta };
    }

    yield { type: 'done' };
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

    await this.ensureDefaultKnowledgeBase();
    this.defaultsEnsured = true;

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

  async listKnowledgeBase(q?: string) {
    const entries = await this.prisma.knowledgeBase.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, metadata: true, createdAt: true },
    });

    const normalized = entries
      .map((entry) => {
        const title = getMetadataTitle(entry.metadata);
        const type = getMetadataType(entry.metadata);
        return {
          id: entry.id,
          title,
          type,
          createdAt: entry.createdAt,
          contentPreview: entry.content.slice(0, 180),
        };
      })
      .filter((item) =>
        q && q.trim().length
          ? `${item.title || ''} ${item.type || ''} ${item.contentPreview}`
              .toLowerCase()
              .includes(q.toLowerCase())
          : true,
      );

    return { total: normalized.length, entries: normalized };
  }

  async createKnowledgeBaseEntry(dto: {
    title: string;
    content: string;
    type?: string;
  }) {
    const created = await this.prisma.knowledgeBase.create({
      data: {
        content: dto.content,
        metadata: {
          title: dto.title,
          type: dto.type || 'custom',
          source: 'admin',
        },
      },
      select: { id: true, createdAt: true },
    });

    // Force re-embedding on the next reindex (or lazy embedding on next query).
    return { ok: true, id: created.id, createdAt: created.createdAt };
  }

  async deleteKnowledgeBaseEntry(id: string) {
    await this.prisma.knowledgeBase.delete({ where: { id } });
    return { ok: true };
  }

  private async getRagContext(
    query: string,
  ): Promise<{ context: string; sources: RagSource[]; topScore: number | null }> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return { context: await this.searchKnowledgeBase(query), sources: [], topScore: null };
    }

    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.embedText(apiKey, query);
    } catch {
      return { context: await this.searchKnowledgeBase(query), sources: [], topScore: null };
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
  ): { context: string; sources: RagSource[]; topScore: number | null } {
    const top = scored
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score >= 0.2)
      .slice(0, 4);

    if (top.length === 0) return { context: '', sources: [], topScore: null };

    const sources: RagSource[] = top.map(({ entry, score }) => ({
      id: entry.id,
      title: getMetadataTitle(entry.metadata),
      type: getMetadataType(entry.metadata),
      score,
      createdAt: entry.createdAt,
    }));

    const context = top
      .map(({ entry }) => {
        const title = getMetadataTitle(entry.metadata);
        return title ? `### ${title}\n${entry.content}` : entry.content;
      })
      .join('\n\n');

    return { context, sources, topScore: top[0]?.score ?? null };
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
    const preferredModel = process.env.GEMINI_CHAT_MODEL?.trim();

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
      const initialModel = await this.resolveChatModel(
        apiKey,
        baseUrl,
        preferredModel,
      );

      let triedModels = new Set<string>();
      let res = await this.generateWithModel(
        apiKey,
        baseUrl,
        initialModel,
        systemPrompt,
        contents,
        controller.signal,
      );
      triedModels.add(initialModel);

      if (!res.ok && (res.status === 404 || res.status === 400)) {
        // 404/400 here usually means the configured model isn't available for this API key
        // (free tier often differs) or isn't supported for generateContent.
        this.chatModelCache = null;
        const candidates = await this.resolveChatModelCandidates(apiKey, baseUrl);

        for (const model of candidates) {
          if (triedModels.has(model)) continue;
          res = await this.generateWithModel(
            apiKey,
            baseUrl,
            model,
            systemPrompt,
            contents,
            controller.signal,
          );
          triedModels.add(model);
          if (res.ok) {
            this.chatModelCache = model;
            break;
          }
          if (!(res.status === 404 || res.status === 400)) break;
        }
      }

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

  private async generateWithModel(
    apiKey: string,
    baseUrl: string,
    model: string,
    systemPrompt: string,
    contents: unknown,
    signal: AbortSignal,
  ) {
    return fetch(
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
        signal,
      },
    );
  }

  private async resolveChatModel(
    apiKey: string,
    baseUrl: string,
    preferredModel?: string,
  ): Promise<string> {
    if (preferredModel) {
      return preferredModel.replace(/^models\//, '');
    }
    if (this.chatModelCache) return this.chatModelCache;

    const candidates = await this.resolveChatModelCandidates(apiKey, baseUrl);
    const picked = candidates[0] || null;
    if (!picked) {
      throw new ServiceUnavailableException(
        'No chat model available for this Gemini API key.',
      );
    }

    this.chatModelCache = picked;
    return picked;
  }

  private async resolveChatModelCandidates(
    apiKey: string,
    baseUrl: string,
  ): Promise<string[]> {
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

      const raw =
        data.models
          ?.filter((m) =>
            (m.supportedGenerationMethods || []).includes('generateContent'),
          )
          .map((m) => (m.name || '').replace(/^models\//, ''))
          .filter(Boolean) || [];

      // Prefer stable ids when a "-latest" alias exists.
      const all = new Set<string>();
      for (const name of raw) {
        all.add(name);
        if (name.toLowerCase().endsWith('-latest')) {
          all.add(name.slice(0, -'-latest'.length));
        }
      }

      const normalized = Array.from(all).filter(Boolean);
      const rank = (name: string) => {
        const lower = name.toLowerCase();
        const isGemini = lower.includes('gemini') ? 1 : 0;
        const isFlash = lower.includes('flash') ? 1 : 0;
        const isLatest = lower.endsWith('-latest') ? 1 : 0;
        // Higher is better; penalize "-latest" to prefer stable ids.
        return isGemini * 100 + isFlash * 10 - isLatest;
      };

      return normalized.sort((a, b) => rank(b) - rank(a));
    } finally {
      clearTimeout(timer);
    }
  }

  private async *generateGeminiResponseStream({
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
  }): AsyncGenerator<string, void, void> {
    const baseUrl =
      process.env.GEMINI_API_BASE_URL?.trim() ||
      'https://generativelanguage.googleapis.com';
    const preferredModel = process.env.GEMINI_CHAT_MODEL?.trim();

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

    const modelCandidates = preferredModel
      ? [preferredModel.replace(/^models\//, '')]
      : await this.resolveChatModelCandidates(apiKey, baseUrl);

    let lastErrorText: string | null = null;
    for (const model of modelCandidates.slice(0, 6)) {
      try {
        const res = await this.streamGenerateWithModel(
          apiKey,
          baseUrl,
          model,
          systemPrompt,
          contents,
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          lastErrorText = text || res.statusText;
          if (res.status === 404 || res.status === 400) continue;
          throw new ServiceUnavailableException(
            `Chat stream failed (${res.status}): ${text || res.statusText}`,
          );
        }

        this.chatModelCache = model;
        yield* this.parseGeminiStream(res);
        return;
      } catch (error) {
        lastErrorText =
          error instanceof Error && error.message ? error.message : 'Unknown error';
      }
    }

    // Fallback: non-streaming request, then chunk the result for the UI.
    const full = await this.generateGeminiResponse({
      apiKey,
      systemPrompt,
      contextData,
      message,
      history,
    }).catch((err) => {
      throw new ServiceUnavailableException(
        lastErrorText || (err instanceof Error ? err.message : 'Chat request failed.'),
      );
    });

    for (const chunk of chunkText(full, 28)) {
      yield chunk;
    }
  }

  private async streamGenerateWithModel(
    apiKey: string,
    baseUrl: string,
    model: string,
    systemPrompt: string,
    contents: unknown,
  ) {
    const controller = new AbortController();
    const timeoutMs = 25_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(
        `${baseUrl}/v1beta/models/${model}:streamGenerateContent?key=${encodeURIComponent(apiKey)}`,
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
    } finally {
      clearTimeout(timer);
    }
  }

  private async *parseGeminiStream(
    res: Response,
  ): AsyncGenerator<string, void, void> {
    const body = res.body;
    if (!body) return;

    // Node fetch provides a web ReadableStream.
    const reader = body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let emitted = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (!line.startsWith('data:')) continue;

        const payload = line.slice('data:'.length).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const data = JSON.parse(payload) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const next =
            data.candidates?.[0]?.content?.parts
              ?.map((p) => p.text || '')
              .join('') || '';

          const nextTrimmed = next;
          if (!nextTrimmed) continue;

          if (nextTrimmed.startsWith(emitted)) {
            const delta = nextTrimmed.slice(emitted.length);
            if (delta) yield delta;
          } else {
            yield nextTrimmed;
          }
          emitted = nextTrimmed;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }

  private async ensureDefaultKnowledgeBase() {
    const defaults = getDefaultKnowledgeBaseEntries();
    if (defaults.length === 0) return;

    const existing = await this.prisma.knowledgeBase.findMany({
      select: { metadata: true },
    });
    const existingTitles = new Set(
      existing
        .map((e) => getMetadataTitle(e.metadata))
        .filter(
          (t): t is string => typeof t === 'string' && t.trim().length > 0,
        ),
    );

    const toCreate = defaults.filter((d) => !existingTitles.has(d.metadata.title));
    if (toCreate.length === 0) return;

    await this.prisma.knowledgeBase.createMany({
      data: toCreate.map((d) => ({
        content: d.content,
        metadata: d.metadata,
      })),
    });
  }

  private async ensureDefaultsOnce() {
    if (this.defaultsEnsured) return;
    await this.ensureDefaultKnowledgeBase();
    this.defaultsEnsured = true;
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

function getMetadataType(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null;
  const type = (metadata as { type?: unknown }).type;
  return typeof type === 'string' && type.trim().length ? type.trim() : null;
}

function chunkText(text: string, chunkSize: number) {
  const chunks: string[] = [];
  const cleaned = text || '';
  for (let i = 0; i < cleaned.length; i += chunkSize) {
    chunks.push(cleaned.slice(i, i + chunkSize));
  }
  return chunks;
}

function getDefaultKnowledgeBaseEntries(): Array<{
  content: string;
  metadata: { title: string; type: string; source: string };
}> {
  // Keep these entries small and factual; they power RAG retrieval.
  return [
    {
      metadata: { title: 'Mess timings', type: 'mess', source: 'default' },
      content:
        'Mess timings:\n' +
        '- Breakfast: 8:30 AM – 10:30 AM\n' +
        '- Lunch: 12:30 PM – 2:30 PM\n' +
        '- Dinner: 7:30 PM – 9:30 PM\n' +
        'Timings may change on holidays/special days; confirm with the Mess Manager if needed.',
    },
    {
      metadata: { title: 'Weekly mess menu (default)', type: 'mess', source: 'default' },
      content:
        'Weekly mess menu (subject to change):\n\n' +
        'Breakfast (8:30 AM – 10:30 AM)\n' +
        '- Monday: Besan chilla + chutney; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Tuesday: Poha; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Wednesday: Vada sambar / Idli sambar; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Thursday: Poori with aloo dum; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Friday: Upma with chutney; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Saturday: Chhole-bhature; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Sunday: Aloo paratha; cornflakes; milk; tea; boiled eggs; banana\n\n' +
        'Lunch (12:30 PM – 2:30 PM)\n' +
        '- Monday: Butter paneer masala / Butter chicken + chana dal + rice + roti + raita\n' +
        '- Tuesday: Kadhi pakoda + aloo jeera + rice + roti + raita\n' +
        '- Wednesday: Fish curry / Kadhai paneer + lal masoor dal + rice + roti + raita\n' +
        '- Thursday: Chhole + kewa datshi + rice + roti + raita\n' +
        '- Friday: Sri Lankan chicken curry / Paneer do pyaza + black masoor dal + rice + roti + raita\n' +
        '- Saturday: Khichdi + aloo fry + chutney + mixed raita + papad\n' +
        '- Sunday: Baingan bharta + arhar dal fry + rice + roti + salad\n\n' +
        'Dinner (7:30 PM – 9:30 PM)\n' +
        '- Monday: Gobhi masala + arhar dal + rice + roti + salad\n' +
        '- Tuesday: Mixed vegetables + moong dal + rice + roti + salad\n' +
        '- Wednesday: Aloo shimla + mixed dal + rice + roti + salad\n' +
        '- Thursday: Egg curry / Veg kofta + chana dal + rice + roti + salad\n' +
        '- Friday: Lauki chana + dal makhani + rice + roti + salad\n' +
        '- Saturday: Chicken do pyaza / Kadhai mushroom + chana dal tadka + rice + roti + salad\n' +
        '- Sunday: Veg biryani / Chicken biryani + raita + mirchi ka salan + dessert (kheer / gulab jamun / seviyan)',
    },
  ];
}
