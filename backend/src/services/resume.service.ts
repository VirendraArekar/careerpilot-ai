import fs from 'node:fs/promises';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import PDFDocument from 'pdfkit';
import { generateAI } from './ai.service.js';

const STOP_WORDS = new Set([
  'with',
  'from',
  'that',
  'this',
  'your',
  'have',
  'will',
  'into',
  'using',
  'work',
  'role',
  'years',
  'team',
  'skills',
  'experience',
  'required',
  'preferred',
  'about',
  'their',
]);

export async function extractDocumentText(filePath: string, mimeType: string) {
  const buffer = await fs.readFile(filePath);
  if (mimeType === 'application/pdf')
    return (await pdfParse(buffer)).text.replace(/\s+/g, ' ').trim();
  if (mimeType.includes('wordprocessingml'))
    return (await mammoth.extractRawText({ buffer })).value.replace(/\s+/g, ' ').trim();
  return buffer.toString('utf8').replace(/\s+/g, ' ').trim();
}

export function keywords(text: string) {
  const counts = new Map<string, number>();
  const tokens = text.toLowerCase().match(/[a-z][a-z0-9.+#-]{2,}/g) ?? [];
  for (const token of tokens)
    if (!STOP_WORDS.has(token)) counts.set(token, (counts.get(token) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)
    .slice(0, 35);
}

export function calculateAts(rawText: string, jobDescription = '') {
  const resumeKeywords = new Set(keywords(rawText));
  const targetKeywords = keywords(jobDescription);
  const matchedKeywords = targetKeywords.filter((item) => resumeKeywords.has(item));
  const missingKeywords = targetKeywords.filter((item) => !resumeKeywords.has(item)).slice(0, 15);
  const hasSection = (pattern: RegExp) => pattern.test(rawText);
  const sections = {
    contact: Math.min(
      100,
      (/@/.test(rawText) ? 35 : 0) +
        (/\+?\d[\d\s-]{8,}/.test(rawText) ? 35 : 0) +
        (/linkedin/i.test(rawText) ? 30 : 0)
    ),
    summary: hasSection(/summary|profile|objective/i) ? 100 : 40,
    experience: hasSection(/experience|employment|work history/i) ? 100 : 45,
    education: hasSection(/education|university|degree/i) ? 100 : 45,
    skills: hasSection(/skills|technologies|tech stack/i) ? 100 : 50,
    impact: Math.min(100, (rawText.match(/\b\d+(?:%|\+|x|k|m)?\b/gi) ?? []).length * 8 + 25),
  };
  const structureScore =
    Object.values(sections).reduce((sum, value) => sum + value, 0) / Object.keys(sections).length;
  const keywordScore = targetKeywords.length
    ? (matchedKeywords.length / targetKeywords.length) * 100
    : 70;
  const score = Math.round(Math.min(98, structureScore * 0.55 + keywordScore * 0.45));
  return { score, sections, matchedKeywords, missingKeywords };
}

const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
    optimizedText: { type: 'string' },
  },
  required: ['strengths', 'improvements', 'optimizedText'],
};

export async function enrichResume(rawText: string, jobDescription: string, userId: string) {
  return generateAI<{ strengths: string[]; improvements: string[]; optimizedText: string }>({
    userId,
    feature: 'resume-analysis',
    schema: analysisSchema,
    schemaName: 'resume_analysis',
    instructions:
      'Act as a senior ATS resume editor. Improve clarity, keywords, quantified impact, collaboration, and stakeholder communication while retaining only facts in the source resume.',
    input: `RESUME:\n${rawText.slice(0, 35_000)}\n\nTARGET JOB:\n${jobDescription || 'Senior full-stack software engineering'}`,
    fallback: () => ({
      strengths: [
        'Clear full-stack technology coverage',
        'Enterprise delivery experience',
        'Relevant project history',
      ],
      improvements: [
        'Add measurable outcomes to more bullets',
        'Tailor the top skills to the target job',
        'Keep bullets concise and action-oriented',
      ],
      optimizedText: rawText,
    }),
  });
}

export async function writeResumePdf(text: string, outputPath: string) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await new Promise<void>(async (resolve, reject) => {
    const document = new PDFDocument({ margin: 52, size: 'A4' });
    const stream = document.pipe((await import('node:fs')).createWriteStream(outputPath));
    document.font('Helvetica').fontSize(10.5).fillColor('#172033').text(text, { lineGap: 3 });
    document.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

export function chunkText(text: string, size = 1100, overlap = 180) {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += size - overlap)
    chunks.push(text.slice(start, start + size));
  return chunks.filter(Boolean);
}
