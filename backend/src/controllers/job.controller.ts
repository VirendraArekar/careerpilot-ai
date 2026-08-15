import type { Request, Response } from 'express';
import { Application, Job, Resume } from '../models/index.js';
import { cosineSimilarity, createEmbedding } from '../services/ai.service.js';
import { calculateAts } from '../services/resume.service.js';
import { asyncHandler } from '../utils/http.js';

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const query: Record<string, unknown> = { status: 'open' };
  if (req.query.workMode) query.workMode = req.query.workMode;
  if (req.query.search) query.$text = { $search: String(req.query.search) };
  const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(100);
  res.json({ jobs });
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const embedding = await createEmbedding(
    `${req.body.title}\n${req.body.skills?.join(', ')}\n${req.body.description}`
  );
  const job = await Job.create({ ...req.body, owner: req.user!.id, embedding });
  res.status(201).json({ job });
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const filter =
    req.user!.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user!.id };
  const job = await Job.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ job });
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const filter =
    req.user!.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user!.id };
  const job = await Job.findOneAndDelete(filter);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.status(204).send();
});

export const matchJob = asyncHandler(async (req: Request, res: Response) => {
  const [job, resume] = await Promise.all([
    Job.findById(req.params.id).select('+embedding'),
    Resume.findOne({ _id: req.body.resumeId, user: req.user!.id }).select('+embedding'),
  ]);
  if (!job || !resume) return res.status(404).json({ message: 'Job or resume not found' });
  const ats = calculateAts(resume.rawText, job.description);
  const semantic = Math.round(cosineSimilarity(resume.embedding, job.embedding) * 100);
  const matchScore = semantic > 0 ? Math.round(ats.score * 0.7 + semantic * 0.3) : ats.score;
  res.json({ match: { ...ats, semanticScore: semantic, matchScore } });
});

export const recommendations = asyncHandler(async (req: Request, res: Response) => {
  const resume = await Resume.findOne({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .select('+embedding');
  const jobs = await Job.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(100)
    .select('+embedding');
  const ranked = jobs
    .map((job) => {
      const ats = resume
        ? calculateAts(resume.rawText, job.description)
        : { score: 0, missingKeywords: [], matchedKeywords: [] };
      const semantic = resume ? cosineSimilarity(resume.embedding, job.embedding) * 100 : 0;
      return {
        ...job.toObject(),
        matchScore: Math.round(semantic ? ats.score * 0.7 + semantic * 0.3 : ats.score),
        matchedKeywords: ats.matchedKeywords,
        missingKeywords: ats.missingKeywords,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
  res.json({ recommendations: ranked });
});

export const applyToJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  const resume = await Resume.findOne({ _id: req.body.resumeId, user: req.user!.id });
  if (!job || !resume) return res.status(404).json({ message: 'Job or resume not found' });
  const { score } = calculateAts(resume.rawText, job.description);
  const application = await Application.findOneAndUpdate(
    { user: req.user!.id, job: job.id },
    {
      resume: resume.id,
      status: req.body.status ?? 'applied',
      notes: req.body.notes,
      nextActionAt: req.body.nextActionAt,
      matchScore: score,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('job');
  res.status(201).json({ application });
});
