import OpenAI from 'openai';
import { env } from '../config/env.js';
import { Usage } from '../models/index.js';

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

type AiOptions<T> = {
  feature: string;
  userId?: string;
  instructions: string;
  input: string;
  schema?: Record<string, unknown>;
  schemaName?: string;
  fallback: () => T;
};

/** Runs an OpenAI Responses API request and records usage. A deterministic fallback keeps local demo mode usable. */
export async function generateAI<T>(options: AiOptions<T>): Promise<T> {
  if (!client) {
    if (env.DEMO_AI_FALLBACK) return options.fallback();
    const error = new Error('OPENAI_API_KEY is not configured');
    (error as Error & { status: number }).status = 503;
    throw error;
  }

  const startedAt = Date.now();
  try {
    const request: Record<string, unknown> = {
      model: env.OPENAI_MODEL,
      instructions: `${options.instructions}\nReturn truthful content only. Never invent employment, education, skills, metrics, or credentials.`,
      input: options.input,
      store: false,
    };
    if (options.schema) {
      request.text = {
        format: {
          type: 'json_schema',
          name: options.schemaName ?? 'result',
          strict: true,
          schema: options.schema,
        },
      };
    }
    const response = await client.responses.create(request as never);
    const usage = response.usage;
    await Usage.create({
      user: options.userId,
      feature: options.feature,
      model: env.OPENAI_MODEL,
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      success: true,
      latencyMs: Date.now() - startedAt,
    });
    const text = response.output_text;
    if (!options.schema) return text as T;
    return JSON.parse(text) as T;
  } catch (error) {
    await Usage.create({
      user: options.userId,
      feature: options.feature,
      model: env.OPENAI_MODEL,
      success: false,
      latencyMs: Date.now() - startedAt,
    }).catch(() => null);
    throw error;
  }
}

/** Creates an embedding for semantic similarity and RAG. */
export async function createEmbedding(text: string) {
  if (!client) return undefined;
  const result = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: text.slice(0, 25_000),
  });
  return result.data[0]?.embedding;
}

export function cosineSimilarity(a?: number[], b?: number[]) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index]! * b[index]!;
    magA += a[index]! ** 2;
    magB += b[index]! ** 2;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}
