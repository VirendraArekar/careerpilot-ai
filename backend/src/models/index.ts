import mongoose, { Schema, model } from 'mongoose';

export type Role = 'candidate' | 'recruiter' | 'admin';
export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  headline: string;
  location: string;
  phone: string;
  linkedin: string;
  summary: string;
  skills: string[];
  education: string[];
  experience: unknown[];
  photoUrl?: string;
  resumeUrl?: string;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['candidate', 'recruiter', 'admin'], default: 'candidate' },
    headline: { type: String, default: '' },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: { type: [String], default: [] },
    education: { type: [String], default: [] },
    experience: { type: [Schema.Types.Mixed], default: [] },
    photoUrl: String,
    resumeUrl: String,
    preferences: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
userSchema.methods.toJSON = function () {
  const value = this.toObject();
  delete value.passwordHash;
  return value;
};
export const User = model<IUser>('User', userSchema);

export interface IResume {
  user: mongoose.Types.ObjectId;
  name: string;
  fileUrl: string;
  rawText: string;
  targetJobDescription?: string;
  score: number;
  sections: Record<string, number>;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  improvements: string[];
  optimizedText?: string;
  embedding?: number[];
  createdAt: Date;
}
const resumeSchema = new Schema<IResume>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    rawText: { type: String, required: true },
    targetJobDescription: String,
    score: { type: Number, default: 0 },
    sections: { type: Schema.Types.Mixed, default: {} },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    optimizedText: String,
    embedding: { type: [Number], select: false },
  },
  { timestamps: true }
);
export const Resume = model<IResume>('Resume', resumeSchema);

export interface IJob {
  owner?: mongoose.Types.ObjectId;
  title: string;
  company: string;
  location: string;
  workMode: string;
  employmentType: string;
  description: string;
  skills: string[];
  minExperience: number;
  salaryMin?: number;
  salaryMax?: number;
  status: string;
  embedding?: number[];
  createdAt: Date;
}
const jobSchema = new Schema<IJob>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: 'Remote' },
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'remote' },
    employmentType: { type: String, default: 'Full-time' },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    minExperience: { type: Number, default: 0 },
    salaryMin: Number,
    salaryMax: Number,
    status: { type: String, default: 'open' },
    embedding: { type: [Number], select: false },
  },
  { timestamps: true }
);
jobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });
export const Job = model<IJob>('Job', jobSchema);

const applicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    resume: { type: Schema.Types.ObjectId, ref: 'Resume' },
    status: {
      type: String,
      enum: ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected'],
      default: 'saved',
    },
    notes: { type: String, default: '' },
    nextActionAt: Date,
    matchScore: { type: Number, default: 0 },
    coverLetter: String,
  },
  { timestamps: true }
);
applicationSchema.index({ user: 1, job: 1 }, { unique: true });
export const Application = model('Application', applicationSchema);

const interviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job' },
    role: { type: String, required: true },
    company: String,
    round: { type: String, default: 'technical' },
    questions: { type: [Schema.Types.Mixed], default: [] },
    answers: { type: [Schema.Types.Mixed], default: [] },
    score: { type: Number, default: 0 },
    feedback: { type: [String], default: [] },
    status: { type: String, default: 'active' },
  },
  { timestamps: true }
);
export const Interview = model('Interview', interviewSchema);

const conversationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Career Assistant' },
    resume: { type: Schema.Types.ObjectId, ref: 'Resume' },
    messages: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);
export const Conversation = model('Conversation', conversationSchema);

const coverLetterSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job' },
    company: String,
    role: String,
    tone: String,
    content: String,
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);
export const CoverLetter = model('CoverLetter', coverLetterSchema);

const codingAttemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: String,
    language: String,
    code: String,
    score: Number,
    passed: Number,
    total: Number,
    complexity: String,
    feedback: { type: [String], default: [] },
  },
  { timestamps: true }
);
export const CodingAttempt = model('CodingAttempt', codingAttemptSchema);

const usageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    feature: String,
    model: String,
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    success: Boolean,
    latencyMs: Number,
  },
  { timestamps: true }
);
export const Usage = model('Usage', usageSchema);

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    link: String,
  },
  { timestamps: true }
);
export const Notification = model('Notification', notificationSchema);
