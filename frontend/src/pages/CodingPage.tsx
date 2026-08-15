import { useEffect, useState } from 'react';
import { Code2, Play, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { Card, PageHeader, ScoreRing } from '../components/ui';

type Challenge = {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  starter: Record<string, string>;
  topics: string[];
};
type Attempt = {
  _id: string;
  challengeId: string;
  language: string;
  score: number;
  passed: number;
  total: number;
  complexity: string;
  feedback: string[];
};
export function CodingPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([api.get('/coding/challenges'), api.get('/coding/attempts')]).then(([c, a]) => {
      setChallenges(c.data.challenges);
      setHistory(a.data.attempts);
      setSelected(c.data.challenges[0]);
      setCode(c.data.challenges[0]?.starter.javascript ?? '');
    });
  }, []);
  const choose = (c: Challenge) => {
    setSelected(c);
    setCode(c.starter[language] ?? '');
    setAttempt(null);
  };
  const changeLanguage = (value: string) => {
    setLanguage(value);
    setCode(selected?.starter[value] ?? '');
  };
  const run = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/coding/challenges/${selected.id}/evaluate`, {
        language,
        code,
      });
      setAttempt(data.attempt);
      setHistory([data.attempt, ...history]);
      toast.success('Solution evaluated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="AI coding workspace"
        title="Code, review, improve"
        description="Submit JavaScript, Java or SQL solutions for correctness, edge cases, complexity and code-quality analysis."
      />
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <Card className="h-fit p-4">
          <h2 className="px-2 text-sm font-bold">Challenges</h2>
          <div className="mt-3 space-y-2">
            {challenges.map((c) => (
              <button
                key={c.id}
                onClick={() => choose(c)}
                className={`w-full rounded-xl p-3 text-left ${selected?.id === c.id ? 'bg-violet-50 text-violet-800' : 'hover:bg-slate-50'}`}
              >
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {c.difficulty} · {c.topics.join(', ')}
                </p>
              </button>
            ))}
          </div>
        </Card>
        <div className="space-y-5">
          {selected && (
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 bg-white p-5">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{selected.title}</h2>
                    <p className="mt-2 text-sm text-slate-500">{selected.description}</p>
                  </div>
                  <select
                    className="field w-40"
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>
              </div>
              <textarea
                spellCheck={false}
                className="min-h-[430px] w-full resize-y bg-[#0f172a] p-6 font-mono text-sm leading-6 text-slate-100 outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="flex justify-end border-t border-slate-200 p-4">
                <button onClick={run} disabled={busy || !code.trim()} className="btn-primary">
                  <Play className="h-4 w-4" />
                  {busy ? 'Reviewing…' : 'Evaluate solution'}
                </button>
              </div>
            </Card>
          )}
          {attempt && (
            <Card className="p-6">
              <div className="flex items-center gap-5">
                <ScoreRing score={Math.round(attempt.score)} />
                <div>
                  <h2 className="text-xl font-bold">Review complete</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {attempt.passed}/{attempt.total} evaluation checks passed · {attempt.complexity}
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {attempt.feedback.map((x) => (
                  <li key={x}>→ {x}</li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold">Recent attempts</h2>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {history.slice(0, 6).map((x) => (
                <div key={x._id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-semibold">{x.challengeId}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {x.language} · {Math.round(x.score)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
