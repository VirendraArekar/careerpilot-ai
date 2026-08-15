export type Role = 'candidate' | 'recruiter' | 'admin';
export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  headline: string;
  location: string;
  phone: string;
  linkedin: string;
  summary: string;
  skills: string[];
  education: string[];
  experience: Array<{ company: string; role: string; period: string; highlights: string[] }>;
  photoUrl?: string;
  resumeUrl?: string;
  preferences?: Record<string, unknown>;
}
export interface Resume {
  _id: string;
  name: string;
  fileUrl: string;
  score: number;
  sections: Record<string, number>;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  improvements: string[];
  optimizedText?: string;
  rawText: string;
  createdAt: string;
}
export interface Job {
  _id: string;
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
  matchScore?: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}
export interface Application {
  _id: string;
  job: Job;
  status: string;
  notes: string;
  matchScore: number;
  nextActionAt?: string;
  updatedAt: string;
  user?: User;
}
export interface Interview {
  _id: string;
  role: string;
  company: string;
  round: string;
  questions: Array<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
    expectedTopics: string[];
  }>;
  answers: Array<{ questionId: string; answer: string; score: number; feedback: string[] }>;
  score: number;
  status: string;
  createdAt: string;
}
