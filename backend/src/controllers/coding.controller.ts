import type { Request, Response } from 'express';
import { CodingAttempt } from '../models/index.js';
import { generateAI } from '../services/ai.service.js';
import { asyncHandler } from '../utils/http.js';

const CHALLENGES = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Return the indices of two numbers that add up to the target.',
    starter: {
      javascript: 'function twoSum(nums, target) {\n  // your solution\n}',
      java: 'class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{}; } }',
      sql: '-- SQL is not applicable to this algorithm challenge',
    },
    topics: ['Array', 'Hash Map'],
  },
  {
    id: 'orders-by-customer',
    title: 'Customer Order Totals',
    difficulty: 'Medium',
    description:
      'Write a query returning customer_id and total_amount for completed orders, highest total first.',
    starter: {
      javascript: '',
      java: '',
      sql: 'SELECT customer_id, SUM(amount) AS total_amount\nFROM orders\n-- complete the query',
    },
    topics: ['SQL', 'Aggregation'],
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Hard',
    description: 'Implement get and put in O(1) average time.',
    starter: {
      javascript:
        'class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}',
      java: 'class LRUCache { LRUCache(int capacity) {} int get(int key) { return -1; } void put(int key, int value) {} }',
      sql: '',
    },
    topics: ['Design', 'Hash Map', 'Linked List'],
  },
];

export const listChallenges = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ challenges: CHALLENGES });
});

const evaluationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'number' },
    passed: { type: 'integer' },
    total: { type: 'integer' },
    complexity: { type: 'string' },
    feedback: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'passed', 'total', 'complexity', 'feedback'],
};

export const evaluateSolution = asyncHandler(async (req: Request, res: Response) => {
  const challenge = CHALLENGES.find((item) => item.id === req.params.id);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  const evaluation = await generateAI<{
    score: number;
    passed: number;
    total: number;
    complexity: string;
    feedback: string[];
  }>({
    userId: req.user!.id,
    feature: 'code-review',
    schema: evaluationSchema,
    schemaName: 'code_evaluation',
    instructions:
      'Act as a strict coding judge and reviewer. Evaluate correctness, edge cases, security, readability, and time/space complexity. Treat missing or non-compiling code as score 0.',
    input: `Challenge: ${challenge.description}\nLanguage: ${req.body.language}\nSolution:\n${req.body.code}`,
    fallback: () => ({
      score: req.body.code.length > 80 ? 65 : 20,
      passed: req.body.code.length > 80 ? 6 : 2,
      total: 10,
      complexity: 'Configure OPENAI_API_KEY for full complexity analysis',
      feedback: ['Add explicit edge-case handling', 'Explain time and space complexity'],
    }),
  });
  const attempt = await CodingAttempt.create({
    user: req.user!.id,
    challengeId: challenge.id,
    language: req.body.language,
    code: req.body.code,
    ...evaluation,
  });
  res.status(201).json({ attempt });
});

export const listAttempts = asyncHandler(async (req: Request, res: Response) => {
  res.json({ attempts: await CodingAttempt.find({ user: req.user!.id }).sort({ createdAt: -1 }) });
});
