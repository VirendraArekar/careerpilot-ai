import path from 'node:path';
import type { Request, Response } from 'express';
import { Resume } from '../models/index.js';
import { createEmbedding } from '../services/ai.service.js';
import {
  calculateAts,
  enrichResume,
  extractDocumentText,
  writeResumePdf,
} from '../services/resume.service.js';
import { asyncHandler } from '../utils/http.js';

export const listResumes = asyncHandler(async (req: Request, res: Response) => {
  res.json({ resumes: await Resume.find({ user: req.user!.id }).sort({ createdAt: -1 }) });
});

export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'Upload a PDF, DOCX, or TXT resume' });
  const rawText = await extractDocumentText(req.file.path, req.file.mimetype);
  if (rawText.length < 80)
    return res
      .status(400)
      .json({ message: 'The uploaded file does not contain enough readable text' });
  const targetJobDescription = String(req.body.targetJobDescription ?? '');
  const localAnalysis = calculateAts(rawText, targetJobDescription);
  const [ai, embedding] = await Promise.all([
    enrichResume(rawText, targetJobDescription, req.user!.id),
    createEmbedding(rawText),
  ]);
  const resume = await Resume.create({
    user: req.user!.id,
    name: req.file.originalname,
    fileUrl: `/uploads/resumes/${req.file.filename}`,
    rawText,
    targetJobDescription,
    ...localAnalysis,
    ...ai,
    embedding,
  });
  req.user!.resumeUrl = resume.fileUrl;
  await req.user!.save();
  res.status(201).json({ resume });
});

export const getResume = asyncHandler(async (req: Request, res: Response) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user!.id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  res.json({ resume });
});

export const reanalyseResume = asyncHandler(async (req: Request, res: Response) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user!.id }).select(
    '+embedding'
  );
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const target = String(req.body.targetJobDescription ?? resume.targetJobDescription ?? '');
  const ai = await enrichResume(resume.rawText, target, req.user!.id);
  Object.assign(resume, calculateAts(resume.rawText, target), ai, { targetJobDescription: target });
  await resume.save();
  res.json({ resume });
});

export const downloadOptimized = asyncHandler(async (req: Request, res: Response) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user!.id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const output = path.resolve('uploads/resumes', `optimized-${resume.id}.pdf`);
  await writeResumePdf(resume.optimizedText || resume.rawText, output);
  res.download(output, `CareerPilot-Optimized-${resume.name.replace(/\.[^.]+$/, '')}.pdf`);
});

export const deleteResume = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  if (!deleted) return res.status(404).json({ message: 'Resume not found' });
  res.status(204).send();
});
