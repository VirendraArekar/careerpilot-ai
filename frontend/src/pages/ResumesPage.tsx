import { useRef, useState } from 'react';
import { Download, FileUp, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ROOT, api, errorMessage } from '../api/client';
import { Card, Empty, Loading, PageHeader, ScoreRing } from '../components/ui';
import { useApi } from '../hooks/useApi';
import type { Resume } from '../types';

export function ResumesPage() {
  const input = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Resume | null>(null);
  const { data, loading, reload } = useApi<Resume[]>(
    async () => (await api.get('/resumes')).data.resumes,
    []
  );
  const upload = async () => {
    const file = input.current?.files?.[0];
    if (!file) return toast.error('Select a resume first');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      form.append('targetJobDescription', target);
      const { data } = await api.post('/resumes', form);
      setSelected(data.resume);
      await reload();
      toast.success('Resume analysed');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    await api.delete(`/resumes/${id}`);
    if (selected?._id === id) setSelected(null);
    await reload();
    toast.success('Resume removed');
  };
  const download = async (id: string, name: string) => {
    const response = await api.get(`/resumes/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-${name.replace(/\.[^.]+$/, '')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  if (loading) return <Loading />;
  const detail = selected ?? data?.[0];
  return (
    <>
      <PageHeader
        eyebrow="AI resume studio"
        title="Build a resume that earns attention"
        description="Upload PDF, DOCX or TXT. CareerPilot extracts the document, calculates ATS fit and uses OpenAI to improve only truthful content."
      />
      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto]">
          <label className="rounded-xl border border-dashed border-violet-300 bg-violet-50 p-3 text-sm font-semibold text-violet-700">
            <input
              ref={input}
              type="file"
              accept=".pdf,.docx,.txt"
              className="block w-full text-xs"
            />
          </label>
          <textarea
            className="field min-h-20"
            placeholder="Paste target job description for accurate matching (optional)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <button disabled={busy} onClick={upload} className="btn-primary self-stretch">
            <FileUp className="h-4 w-4" />
            {busy ? 'Analysing…' : 'Upload & analyse'}
          </button>
        </div>
      </Card>
      {!data?.length ? (
        <div className="mt-6">
          <Empty
            title="No analysed resumes"
            description="Upload your first resume to calculate its ATS score."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
          <div className="space-y-3">
            {data.map((item) => (
              <button
                key={item._id}
                onClick={() => setSelected(item)}
                className={`surface w-full p-4 text-left transition ${detail?._id === item._id ? 'border-violet-400 ring-4 ring-violet-50' : 'hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-3">
                  <ScoreRing score={item.score} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {detail && (
            <Card className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <ScoreRing score={detail.score} />
                  <div>
                    <h2 className="text-xl font-bold">ATS analysis</h2>
                    <p className="text-sm text-slate-500">{detail.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => download(detail._id, detail.name)}
                    className="btn-secondary"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                  <button onClick={() => remove(detail._id)} className="btn-secondary text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-7 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-bold">Section quality</h3>
                  <div className="mt-4 space-y-3">
                    {Object.entries(detail.sections).map(([name, value]) => (
                      <div key={name}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="capitalize text-slate-500">{name}</span>
                          <strong>{value}%</strong>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-violet-600"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold">Keyword fit</h3>
                  <p className="mt-3 text-xs font-semibold uppercase text-emerald-600">Matched</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detail.matchedKeywords.length ? (
                      detail.matchedKeywords.map((x) => (
                        <span className="chip !bg-emerald-50 !text-emerald-700" key={x}>
                          {x}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">Add a target job description.</span>
                    )}
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase text-amber-600">Missing</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detail.missingKeywords.map((x) => (
                      <span className="chip !bg-amber-50 !text-amber-700" key={x}>
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-7 grid gap-6 border-t border-slate-100 pt-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-bold text-emerald-700">Strengths</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {detail.strengths.map((x) => (
                      <li key={x}>✓ {x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-amber-700">Improvements</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {detail.improvements.map((x) => (
                      <li key={x}>→ {x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {detail.optimizedText && (
                <details className="mt-6 rounded-xl bg-slate-50 p-4">
                  <summary className="cursor-pointer font-semibold">
                    Preview optimized content
                  </summary>
                  <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-600">
                    {detail.optimizedText}
                  </pre>
                </details>
              )}
            </Card>
          )}
        </div>
      )}
    </>
  );
}
