import path from 'node:path';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/database.js';
import { Job, Resume, User } from './models/index.js';
import { calculateAts, extractDocumentText } from './services/resume.service.js';

const profile = {
  name: 'Virendra Minanath Arekar',
  email: process.env.SEED_ADMIN_EMAIL ?? 'virendra.arekar@gmail.com',
  role: 'admin' as const,
  headline: 'Senior Full Stack Developer | Java | Spring Boot | Node.js | React.js | AI/RAG',
  location: 'Mumbai, India',
  phone: '+91-8983486922',
  linkedin: 'https://linkedin.com/in/virendra-arekar-2a9a6292',
  summary:
    'Senior Full Stack Developer and Consultant with 11+ years of experience delivering enterprise platforms across banking, insurance, retail and e-commerce. Specializes in Java, Spring Boot, Node.js, React.js, microservices, AWS and AI/RAG solutions.',
  skills: [
    'Java',
    'Spring Boot',
    'Node.js',
    'Express.js',
    'React.js',
    'Next.js',
    'TypeScript',
    'MongoDB',
    'PostgreSQL',
    'Microservices',
    'Kafka',
    'AWS',
    'Docker',
    'Kubernetes',
    'LangChain',
    'RAG',
    'MCP',
  ],
  education: [
    'M.Sc. Information Technology — University of Mumbai, 2014',
    'B.Sc. Information Technology — University of Mumbai, 2010',
    'MCA',
  ],
  experience: [
    {
      company: 'Xebia IT Architects',
      role: 'Senior Consultant',
      period: 'Apr 2025 – Present',
      highlights: [
        'Led full-stack delivery for Axis Bank Retail and Aditya Birla Capital',
        'Delivered secure digital journeys across local, UAT, CUG and production',
        'Improved test coverage and removed sensitive application logs',
      ],
    },
    {
      company: 'Test Yantra Software Solutions',
      role: 'Senior Consultant',
      period: 'Jun 2023 – Mar 2025',
      highlights: [
        'Designed enterprise REST APIs and microservices for financial-services workflows',
      ],
    },
    {
      company: 'Myappdevelopment Pvt. Ltd.',
      role: 'Full Stack Developer',
      period: 'Nov 2021 – Mar 2023',
      highlights: [
        'Delivered web and mobile applications using Node.js, React.js, React Native, Go and Spring Boot',
      ],
    },
    {
      company: 'P. M. Electro Pvt. Ltd.',
      role: 'Full Stack Developer',
      period: 'Mar 2020 – Nov 2021',
      highlights: ['Owned architecture and delivery of cross-platform applications'],
    },
    {
      company: 'Itransparity LLP',
      role: 'Full Stack Developer',
      period: 'Jul 2018 – Dec 2019',
      highlights: ['Developed database-driven full-stack application features'],
    },
    {
      company: 'Concept Computer',
      role: 'Node.js Developer',
      period: 'Jan 2015 – Jun 2018',
      highlights: ['Built reusable backend services and responsive web modules'],
    },
  ],
  preferences: {
    workModes: ['remote', 'hybrid'],
    preferredLocation: 'Mumbai',
    targetRoles: ['Senior Full Stack Developer', 'Senior Consultant', 'Engineering Lead'],
  },
};

const jobs = [
  {
    title: 'Senior MERN Full Stack Engineer',
    company: 'NovaScale AI',
    location: 'Remote — India',
    workMode: 'remote',
    employmentType: 'Full-time',
    minExperience: 8,
    salaryMin: 2400000,
    salaryMax: 3200000,
    skills: ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'RAG'],
    description:
      'Lead React and Node.js product delivery. Design scalable APIs, MongoDB data models, AI/RAG workflows, automated tests, Docker deployments and AWS infrastructure. Mentor engineers and communicate with product stakeholders.',
  },
  {
    title: 'Senior Java Full Stack Consultant',
    company: 'FinVerse Digital',
    location: 'Mumbai',
    workMode: 'hybrid',
    employmentType: 'Full-time',
    minExperience: 9,
    salaryMin: 2600000,
    salaryMax: 3400000,
    skills: ['Java', 'Spring Boot', 'React.js', 'Kafka', 'Kubernetes', 'Microservices'],
    description:
      'Build secure banking journeys using Java, Spring Boot, React, Kafka and microservices. Own design, code reviews, test automation, production releases and stakeholder communication.',
  },
  {
    title: 'AI Full Stack Engineering Lead',
    company: 'TalentMesh',
    location: 'Remote',
    workMode: 'remote',
    employmentType: 'Full-time',
    minExperience: 10,
    salaryMin: 3000000,
    salaryMax: 4200000,
    skills: ['Node.js', 'React.js', 'OpenAI', 'RAG', 'Vector Search', 'Docker'],
    description:
      'Lead an AI SaaS platform using React, Node.js, OpenAI APIs, RAG, embeddings and vector search. Establish secure multi-tenant architecture, observability, evaluation and CI/CD.',
  },
];

async function seed() {
  await connectDatabase();
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'CareerPilot@123', 12);
  const user = await User.findOneAndUpdate(
    { email: profile.email },
    {
      ...profile,
      passwordHash,
      resumeUrl: '/uploads/resumes/Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  for (const job of jobs)
    await Job.findOneAndUpdate(
      { title: job.title, company: job.company },
      { ...job, owner: user.id },
      { upsert: true, new: true }
    );
  const resumePath = path.resolve('uploads/resumes/Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf');
  try {
    await fs.access(resumePath);
    const rawText = await extractDocumentText(resumePath, 'application/pdf');
    await Resume.findOneAndUpdate(
      { user: user.id, name: 'Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf' },
      {
        user: user.id,
        name: 'Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf',
        fileUrl: '/uploads/resumes/Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf',
        rawText,
        ...calculateAts(rawText),
      },
      { upsert: true, new: true }
    );
  } catch {
    console.warn(
      'Seed resume file not present; profile remains usable and a resume can be uploaded in the UI.'
    );
  }
  console.info(`Seed complete. Login: ${profile.email}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
