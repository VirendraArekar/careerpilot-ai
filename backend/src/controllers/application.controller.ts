import type { Request, Response } from 'express';
import { Application } from '../models/index.js';
import { asyncHandler } from '../utils/http.js';

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.user!.role === 'recruiter' ? {} : { user: req.user!.id };
  const applications = await Application.find(filter)
    .populate('job')
    .populate('user', 'name headline photoUrl skills')
    .sort({ updatedAt: -1 });
  res.json({ applications });
});

export const updateApplication = asyncHandler(async (req: Request, res: Response) => {
  const filter =
    req.user!.role === 'candidate'
      ? { _id: req.params.id, user: req.user!.id }
      : { _id: req.params.id };
  const application = await Application.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  }).populate('job');
  if (!application) return res.status(404).json({ message: 'Application not found' });
  res.json({ application });
});

export const deleteApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await Application.findOneAndDelete({
    _id: req.params.id,
    user: req.user!.id,
  });
  if (!application) return res.status(404).json({ message: 'Application not found' });
  res.status(204).send();
});
