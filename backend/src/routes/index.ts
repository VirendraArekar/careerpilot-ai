import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { dashboard, recruiterDashboard } from '../controllers/analytics.controller.js';
import {
  chat,
  generateCoverLetter,
  listConversations,
  listCoverLetters,
} from '../controllers/assistant.controller.js';
import {
  listApplications,
  updateApplication,
  deleteApplication,
} from '../controllers/application.controller.js';
import {
  googleLogin,
  googleSchema,
  login,
  loginSchema,
  me,
  register,
  registerSchema,
} from '../controllers/auth.controller.js';
import {
  evaluateSolution,
  listAttempts,
  listChallenges,
} from '../controllers/coding.controller.js';
import {
  answerInterview,
  createInterview,
  listInterviews,
} from '../controllers/interview.controller.js';
import {
  applyToJob,
  createJob,
  deleteJob,
  listJobs,
  matchJob,
  recommendations,
  updateJob,
} from '../controllers/job.controller.js';
import {
  attachResume,
  getProfile,
  updateProfile,
  uploadPhoto,
} from '../controllers/profile.controller.js';
import {
  deleteResume,
  downloadOptimized,
  getResume,
  listResumes,
  reanalyseResume,
  uploadResume,
} from '../controllers/resume.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const storage = (folder: 'profiles' | 'resumes') =>
  multer.diskStorage({
    destination: path.resolve('uploads', folder),
    filename: (_req, file, callback) =>
      callback(
        null,
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${path.extname(file.originalname).toLowerCase()}`
      ),
  });
const photoUpload = multer({
  storage: storage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
});
const resumeUpload = multer({
  storage: storage('resumes'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ].includes(file.mimetype)
    ),
});

router.post('/auth/register', validate(registerSchema), register);
router.post('/auth/login', validate(loginSchema), login);
router.post('/auth/google', validate(googleSchema), googleLogin);
router.get('/auth/me', requireAuth, me);

router.use(requireAuth);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/profile/photo', photoUpload.single('photo'), uploadPhoto);
router.post('/profile/resume', resumeUpload.single('resume'), attachResume);

router.route('/resumes').get(listResumes).post(resumeUpload.single('resume'), uploadResume);
router.route('/resumes/:id').get(getResume).delete(deleteResume);
router.post('/resumes/:id/analyse', reanalyseResume);
router.get('/resumes/:id/download', downloadOptimized);

router.get('/jobs', listJobs);
router.get('/jobs/recommendations', recommendations);
router.post('/jobs', allowRoles('recruiter', 'admin'), createJob);
router.patch('/jobs/:id', allowRoles('recruiter', 'admin'), updateJob);
router.delete('/jobs/:id', allowRoles('recruiter', 'admin'), deleteJob);
router.post('/jobs/:id/match', matchJob);
router.post('/jobs/:id/apply', allowRoles('candidate', 'admin'), applyToJob);

router.route('/applications').get(listApplications);
router.patch('/applications/:id', updateApplication);
router.delete('/applications/:id', deleteApplication);

router.route('/interviews').get(listInterviews).post(createInterview);
router.post('/interviews/:id/answer', answerInterview);
router.get('/coding/challenges', listChallenges);
router.get('/coding/attempts', listAttempts);
router.post('/coding/challenges/:id/evaluate', evaluateSolution);

router.route('/assistant/conversations').get(listConversations);
router.post('/assistant/chat', chat);
router.route('/cover-letters').get(listCoverLetters).post(generateCoverLetter);
router.get('/analytics/dashboard', dashboard);
router.get('/analytics/recruiter', allowRoles('recruiter', 'admin'), recruiterDashboard);

export default router;
