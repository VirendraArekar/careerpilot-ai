import type { Request, Response } from 'express';
import { asyncHandler, pick } from '../utils/http.js';

const allowed = [
  'name',
  'headline',
  'location',
  'phone',
  'linkedin',
  'summary',
  'skills',
  'education',
  'experience',
  'preferences',
];

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json({ profile: req.user });
});
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  Object.assign(req.user!, pick(req.body, allowed));
  await req.user!.save();
  res.json({ profile: req.user });
});
export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'Select an image to upload' });
  req.user!.photoUrl = `/uploads/profiles/${req.file.filename}`;
  await req.user!.save();
  res.json({ profile: req.user });
});
export const attachResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'Select a resume to upload' });
  req.user!.resumeUrl = `/uploads/resumes/${req.file.filename}`;
  await req.user!.save();
  res.json({ profile: req.user });
});
