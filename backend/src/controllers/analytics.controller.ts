import type { Request, Response } from 'express';
import {
  Application,
  CodingAttempt,
  Interview,
  Job,
  Resume,
  Usage,
  User,
} from '../models/index.js';
import { asyncHandler } from '../utils/http.js';

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const userFilter = { user: req.user!.id };
  const [
    resumeCount,
    latestResume,
    applicationCount,
    applicationsByStatus,
    interviewCount,
    latestInterview,
    codingCount,
    usage,
    jobCount,
  ] = await Promise.all([
    Resume.countDocuments(userFilter),
    Resume.findOne(userFilter).sort({ createdAt: -1 }),
    Application.countDocuments(userFilter),
    Application.aggregate([
      { $match: userFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Interview.countDocuments(userFilter),
    Interview.findOne(userFilter).sort({ createdAt: -1 }),
    CodingAttempt.countDocuments(userFilter),
    Usage.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: null,
          inputTokens: { $sum: '$inputTokens' },
          outputTokens: { $sum: '$outputTokens' },
          calls: { $sum: 1 },
        },
      },
    ]),
    Job.countDocuments({ status: 'open' }),
  ]);
  res.json({
    stats: {
      resumes: resumeCount,
      atsScore: latestResume?.score ?? 0,
      applications: applicationCount,
      interviews: interviewCount,
      interviewScore: latestInterview?.score ?? 0,
      codingAttempts: codingCount,
      openJobs: jobCount,
      aiCalls: usage[0]?.calls ?? 0,
      aiTokens: (usage[0]?.inputTokens ?? 0) + (usage[0]?.outputTokens ?? 0),
    },
    applicationsByStatus: Object.fromEntries(
      applicationsByStatus.map((item) => [item._id, item.count])
    ),
  });
});

export const recruiterDashboard = asyncHandler(async (req: Request, res: Response) => {
  const ownedJobs = await Job.find({ owner: req.user!.id }).select('_id title status');
  const jobIds = ownedJobs.map((item) => item._id);
  const [applications, candidates] = await Promise.all([
    Application.find({ job: { $in: jobIds } })
      .populate('job user', 'title company name headline skills photoUrl')
      .sort({ matchScore: -1 }),
    User.countDocuments({ role: 'candidate' }),
  ]);
  res.json({
    jobs: ownedJobs,
    applications,
    totals: { jobs: ownedJobs.length, applications: applications.length, candidates },
  });
});
