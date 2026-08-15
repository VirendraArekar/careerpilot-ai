import type { Request, Response } from 'express';
import { Conversation, CoverLetter, Job, Resume } from '../models/index.js';
import { createEmbedding, cosineSimilarity, generateAI } from '../services/ai.service.js';
import { chunkText } from '../services/resume.service.js';
import { asyncHandler } from '../utils/http.js';

export const generateCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const [resume, job] = await Promise.all([
    Resume.findOne({ _id: req.body.resumeId, user: req.user!.id }),
    req.body.jobId ? Job.findById(req.body.jobId) : null,
  ]);
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const company = job?.company ?? req.body.company;
  const role = job?.title ?? req.body.role;
  const content = await generateAI<string>({
    userId: req.user!.id,
    feature: 'cover-letter',
    instructions: `Write a ${req.body.tone ?? 'professional'}, concise cover letter. Use only supplied resume facts.`,
    input: `Candidate resume:\n${resume.rawText.slice(0, 25_000)}\n\nCompany: ${company}\nRole: ${role}\nJob description: ${job?.description ?? req.body.jobDescription ?? ''}`,
    fallback: () =>
      `Dear Hiring Manager,\n\nI am interested in the ${role} opportunity at ${company}. My full-stack engineering background and experience delivering enterprise applications align well with this role. I would welcome the opportunity to discuss how I can contribute to your team.\n\nSincerely,\n${req.user!.name}`,
  });
  const letter = await CoverLetter.create({
    user: req.user!.id,
    job: job?.id,
    company,
    role,
    tone: req.body.tone,
    content,
  });
  res.status(201).json({ letter });
});

export const listCoverLetters = asyncHandler(async (req: Request, res: Response) => {
  res.json({ letters: await CoverLetter.find({ user: req.user!.id }).sort({ createdAt: -1 }) });
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    conversations: await Conversation.find({ user: req.user!.id }).sort({ updatedAt: -1 }),
  });
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const resume = await Resume.findOne({ _id: req.body.resumeId, user: req.user!.id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const chunks = chunkText(resume.rawText);
  const queryEmbedding = await createEmbedding(req.body.message);
  const scored = await Promise.all(
    chunks.map(async (text, index) => ({
      text,
      index,
      score: cosineSimilarity(queryEmbedding, await createEmbedding(text)),
    }))
  );
  const context = scored.sort((a, b) => b.score - a.score).slice(0, 4);
  const answer = await generateAI<string>({
    userId: req.user!.id,
    feature: 'rag-chat',
    instructions:
      'You are a source-grounded career assistant. Answer only from the retrieved resume excerpts. Say when evidence is insufficient. Cite excerpts as [Resume chunk N].',
    input: `QUESTION: ${req.body.message}\n\nCONTEXT:\n${context.map((item) => `[Resume chunk ${item.index + 1}] ${item.text}`).join('\n\n')}`,
    fallback: () =>
      `Based on the uploaded resume, the most relevant evidence is: ${context[0]?.text.slice(0, 420) ?? 'No matching content was found.'}`,
  });
  const conversation = req.body.conversationId
    ? await Conversation.findOne({ _id: req.body.conversationId, user: req.user!.id })
    : new Conversation({
        user: req.user!.id,
        resume: resume.id,
        title: req.body.message.slice(0, 60),
        messages: [],
      });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  conversation.messages.push(
    { role: 'user', content: req.body.message, createdAt: new Date() },
    {
      role: 'assistant',
      content: answer,
      sources: context.map((item) => ({
        label: `Resume chunk ${item.index + 1}`,
        excerpt: item.text.slice(0, 180),
      })),
      createdAt: new Date(),
    }
  );
  await conversation.save();
  res.json({ conversation, answer });
});
