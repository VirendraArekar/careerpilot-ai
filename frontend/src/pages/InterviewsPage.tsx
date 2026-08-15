import { useEffect, useState } from 'react';
import { Mic2, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { Card, Empty, PageHeader, ScoreRing } from '../components/ui';
import type { Interview, Job } from '../types';

export function InterviewsPage() {
  const [items, setItems] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Interview | null>(null);
  const [answer, setAnswer] = useState('');
  const [form, setForm] = useState({
    jobId: '',
    role: 'Senior Full Stack Developer',
    company: '',
    round: 'technical',
  });
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const [i, j] = await Promise.all([api.get('/interviews'), api.get('/jobs')]);
    setItems(i.data.interviews);
    setJobs(j.data.jobs);
    setSelected((x) => x ?? i.data.interviews[0] ?? null);
  };
  useEffect(() => {
    void load();
  }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/interviews', form);
      setSelected(data.interview);
      await load();
      setSelected(data.interview);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const current = selected?.questions.find(
    (q) => !selected.answers.some((a) => a.questionId === q.id)
  );
  const submit = async () => {
    if (!selected || !current || !answer.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/interviews/${selected._id}/answer`, {
        questionId: current.id,
        answer,
      });
      setSelected(data.interview);
      setAnswer('');
      toast.success(`Answer scored ${Math.round(data.evaluation.score)}%`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="AI mock interview"
        title="Practice under realistic pressure"
        description="Generate role-specific rounds, answer one question at a time and receive scored feedback."
      />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <form onSubmit={create} className="space-y-3">
              <select
                className="field"
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
              >
                <option value="">Custom role</option>
                {jobs.map((j) => (
                  <option value={j._id} key={j._id}>
                    {j.title} — {j.company}
                  </option>
                ))}
              </select>
              {!form.jobId && (
                <>
                  <input
                    className="field"
                    placeholder="Role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </>
              )}
              <select
                className="field"
                value={form.round}
                onChange={(e) => setForm({ ...form, round: e.target.value })}
              >
                <option value="technical">Technical</option>
                <option value="system-design">System design</option>
                <option value="behavioral">Behavioral</option>
                <option value="managerial">Managerial</option>
              </select>
              <button disabled={busy} className="btn-primary w-full">
                <Sparkles className="h-4 w-4" />
                Generate interview
              </button>
            </form>
          </Card>
          {items.map((x) => (
            <button
              onClick={() => setSelected(x)}
              key={x._id}
              className={`surface w-full p-4 text-left ${selected?._id === x._id ? 'border-violet-400' : ''}`}
            >
              <div className="flex items-center gap-3">
                <ScoreRing score={x.score} size="sm" />
                <div>
                  <p className="font-semibold">{x.role}</p>
                  <p className="text-xs text-slate-400">
                    {x.round} · {x.status}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <Card className="p-7">
          {!selected ? (
            <Empty title="No interview selected" description="Generate a mock round to begin." />
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-violet-600">{selected.company}</p>
                  <h2 className="mt-1 text-2xl font-bold">{selected.role}</h2>
                  <p className="mt-1 text-sm capitalize text-slate-500">
                    {selected.round} round · {selected.answers.length}/{selected.questions.length}{' '}
                    answered
                  </p>
                </div>
                <ScoreRing score={selected.score} />
              </div>
              {current ? (
                <div className="mt-8">
                  <div className="rounded-2xl bg-slate-950 p-6 text-white">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                      <Mic2 className="h-4 w-4" />
                      {current.category} · {current.difficulty}
                    </div>
                    <p className="mt-4 text-xl font-semibold leading-8">{current.question}</p>
                  </div>
                  <textarea
                    className="field mt-5 min-h-48"
                    placeholder="Type your complete answer. Include context, technical decisions, trade-offs and outcome."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <button onClick={submit} disabled={busy} className="btn-primary mt-3">
                    <Send className="h-4 w-4" />
                    {busy ? 'Evaluating…' : 'Submit answer'}
                  </button>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl bg-emerald-50 p-6">
                  <h3 className="text-xl font-bold text-emerald-800">Interview complete</h3>
                  <p className="mt-2 text-sm text-emerald-700">
                    Review the feedback from each answer below.
                  </p>
                </div>
              )}
              <div className="mt-7 space-y-4">
                {selected.answers.map((a, i) => (
                  <details key={i} className="rounded-xl border border-slate-200 p-4">
                    <summary className="cursor-pointer font-semibold">
                      Answer {i + 1} — {Math.round(a.score)}%
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{a.answer}</p>
                    <ul className="mt-3 text-sm text-amber-700">
                      {a.feedback.map((x) => (
                        <li key={x}>→ {x}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
