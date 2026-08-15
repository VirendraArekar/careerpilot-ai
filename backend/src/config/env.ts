import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/careerpilot'),
  JWT_SECRET: z.string().min(16).default('development-secret-change-me-please'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5.6'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DEMO_AI_FALLBACK: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
});

export const env = schema.parse(process.env);
