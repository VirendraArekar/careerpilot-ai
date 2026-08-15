import { useEffect, useState } from 'react';
import { Copy, WandSparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { Card, Empty, PageHeader } from '../components/ui';
import type { Job, Resume } from '../types';

type Letter = {
  _id: string;
  company: string;
  role: string;
  tone: string;
  content: string;
  createdAt: string;
};
export function CoverLettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({
    resumeId: '',
    jobId: '',
    company: '',
    role: '',
    tone: 'professional',
  });
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const [l, r, j] = await Promise.all([
      api.get('/cover-letters'),
      api.get('/resumes'),
      api.get('/jobs'),
    ]);
    setLetters(l.data.letters);
    setResumes(r.data.resumes);
    setJobs(j.data.jobs);
    setForm((x) => ({ ...x, resumeId: x.resumeId || r.data.resumes[0]?._id || '' }));
  };
  useEffect(() => {
    void load();
  }, []);
  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/cover-letters', form);
      await load();
      toast.success('Cover letter generated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Personalized outreach"
        title="Cover letter generator"
        description="Create company-specific letters using facts from the selected resume."
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit p-5">
          <form onSubmit={generate} className="space-y-4">
            <label className="block text-sm font-semibold">
              Resume
              <select
                className="field mt-2"
                value={form.resumeId}
                onChange={(e) => setForm({ ...form, resumeId: e.target.value })}
              >
                {resumes.map((r) => (
                  <option value={r._id} key={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Saved job (optional)
              <select
                className="field mt-2"
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
              >
                <option value="">Enter manually</option>
                {jobs.map((j) => (
                  <option value={j._id} key={j._id}>
                    {j.title} — {j.company}
                  </option>
                ))}
              </select>
            </label>
            {!form.jobId && (
              <>
                <label className="block text-sm font-semibold">
                  Company
                  <input
                    className="field mt-2"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Role
                  <input
                    className="field mt-2"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  />
                </label>
              </>
            )}
            <label className="block text-sm font-semibold">
              Tone
              <select
                className="field mt-2"
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
              >
                <option>professional</option>
                <option>concise</option>
                <option>conversational</option>
                <option>executive</option>
              </select>
            </label>
            <button disabled={busy || !form.resumeId} className="btn-primary w-full">
              <WandSparkles className="h-4 w-4" />
              {busy ? 'Writing…' : 'Generate letter'}
            </button>
          </form>
        </Card>
        <div className="space-y-4">
          {letters.length ? (
            letters.map((l) => (
              <Card key={l._id} className="p-6">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-violet-600">{l.company}</p>
                    <h2 className="mt-1 text-xl font-bold">{l.role}</h2>
                    <p className="mt-1 text-xs capitalize text-slate-400">
                      {l.tone} · {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className="btn-secondary h-fit"
                    onClick={() => {
                      navigator.clipboard.writeText(l.content);
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <pre className="mt-5 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-600">
                  {l.content}
                </pre>
              </Card>
            ))
          ) : (
            <Empty
              title="No cover letters yet"
              description="Select a resume and job to generate your first version."
            />
          )}
        </div>
      </div>
    </>
  );
}
