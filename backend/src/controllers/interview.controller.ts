import type { Request, Response } from 'express';
import { Interview, Job } from '../models/index.js';
import { generateAI } from '../services/ai.service.js';
import { asyncHandler } from '../utils/http.js';

const questionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      minItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          question: { type: 'string' },
          category: { type: 'string' },
          difficulty: { type: 'string' },
          expectedTopics: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'question', 'category', 'difficulty', 'expectedTopics'],
      },
    },
  },
  required: ['questions'],
};

export const createInterview = asyncHandler(async (req: Request, res: Response) => {
  const job = req.body.jobId ? await Job.findById(req.body.jobId) : null;
  const role = job?.title ?? req.body.role;
  const company = job?.company ?? req.body.company ?? 'Target company';
  const result = await generateAI<{ questions: unknown[] }>({
    userId: req.user!.id,
    feature: 'interview-questions',
    schema: questionSchema,
    schemaName: 'interview_questions',
    instructions:
      'Create a realistic interview round. Mix scenario questions with technical depth and do not include answers.',
    input: `Role: ${role}\nCompany: ${company}\nRound: ${req.body.round ?? 'technical'}\nJob description: ${job?.description ?? req.body.jobDescription ?? ''}`,
    fallback: () => ({
      questions: [
        {
          id: 'q1',
          question: 'Explain a production architecture you designed and the trade-offs you made.',
          category: 'system-design',
          difficulty: 'senior',
          expectedTopics: ['scale', 'security', 'observability'],
        },
        {
          id: 'q2',
          question: 'How do you diagnose a slow React and Node.js request path?',
          category: 'full-stack',
          difficulty: 'senior',
          expectedTopics: ['profiling', 'network', 'database'],
        },
        {
          id: 'q3',
          question: 'Design an idempotent event-driven workflow with Kafka.',
          category: 'backend',
          difficulty: 'senior',
          expectedTopics: ['consumer', 'retry', 'deduplication'],
        },
        {
          id: 'q4',
          question: 'How would you secure a multi-tenant MERN application?',
          category: 'security',
          difficulty: 'senior',
          expectedTopics: ['authorization', 'validation', 'isolation'],
        },
        {
          id: 'q5',
          question: 'Describe how you resolved a disagreement across product, QA and engineering.',
          category: 'behavioral',
          difficulty: 'senior',
          expectedTopics: ['communication', 'evidence', 'outcome'],
        },
      ],
    }),
  });
  const interview = await Interview.create({
    user: req.user!.id,
    job: job?.id,
    role,
    company,
    round: req.body.round,
    questions: result.questions,
  });
  res.status(201).json({ interview });
});

const feedbackSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'number' },
    feedback: { type: 'array', items: { type: 'string' } },
    improvedAnswer: { type: 'string' },
  },
  required: ['score', 'feedback', 'improvedAnswer'],
};

export const answerInterview = asyncHandler(async (req: Request, res: Response) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user!.id });
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  const question = (interview.questions as Array<Record<string, unknown>>).find(
    (item) => item.id === req.body.questionId
  );
  if (!question) return res.status(404).json({ message: 'Question not found' });
  const result = await generateAI<{ score: number; feedback: string[]; improvedAnswer: string }>({
    userId: req.user!.id,
    feature: 'interview-evaluation',
    schema: feedbackSchema,
    schemaName: 'interview_feedback',
    instructions:
      'Evaluate the interview answer for correctness, depth, clarity, structure, and senior-level judgment. Score from 0 to 100.',
    input: `Question: ${question.question}\nExpected topics: ${question.expectedTopics}\nCandidate answer: ${req.body.answer}`,
    fallback: () => ({
      score: Math.min(90, Math.max(35, req.body.answer.length / 5)),
      feedback: [
        'Use a clear situation-action-result structure',
        'Add a concrete technical trade-off and measurable outcome',
      ],
      improvedAnswer: req.body.answer,
    }),
  });
  interview.answers.push({
    questionId: req.body.questionId,
    answer: req.body.answer,
    ...result,
    createdAt: new Date(),
  });
  interview.score = Math.round(
    (interview.answers as Array<{ score: number }>).reduce((sum, item) => sum + item.score, 0) /
      interview.answers.length
  );
  interview.feedback = [
    ...new Set(
      (interview.answers as Array<{ feedback: string[] }>).flatMap((item) => item.feedback)
    ),
  ].slice(0, 8);
  if (interview.answers.length >= interview.questions.length) interview.status = 'completed';
  await interview.save();
  res.json({ interview, evaluation: result });
});

export const listInterviews = asyncHandler(async (req: Request, res: Response) => {
  res.json({ interviews: await Interview.find({ user: req.user!.id }).sort({ createdAt: -1 }) });
});
