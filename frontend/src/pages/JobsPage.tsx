import { useEffect, useState } from 'react';
import { Briefcase, MapPin, Search, SlidersHorizontal, WandSparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { Card, Empty, Loading, PageHeader, ScoreRing } from '../components/ui';
import type { Job, Resume } from '../types';

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);
  const [resumeId, setResumeId] = useState('');
  const load = async () => {
    setLoading(true);
    try {
      const [j, r] = await Promise.all([api.get('/jobs/recommendations'), api.get('/resumes')]);
      setJobs(j.data.recommendations);
      setResumes(r.data.resumes);
      setResumeId((x) => x || r.data.resumes[0]?._id || '');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const filtered = jobs.filter(
    (j) =>
      (!mode || j.workMode === mode) &&
      `${j.title} ${j.company} ${j.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase())
  );
  const apply = async (job: Job) => {
    if (!resumeId) return toast.error('Upload a resume before applying');
    try {
      await api.post(`/jobs/${job._id}/apply`, { resumeId, status: 'applied' });
      toast.success(`Application added for ${job.company}`);
      setSelected(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  if (loading) return <Loading label="Finding your strongest matches" />;
  return (
    <>
      <PageHeader
        eyebrow="Semantic job discovery"
        title="Jobs matched to your real experience"
        description="Ranked with ATS keyword fit and OpenAI embeddings—not a hardcoded list."
      />
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              className="field pl-10"
              placeholder="Search roles, companies or skills"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="relative">
            <SlidersHorizontal className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <select className="field pl-10" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">All work modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </label>
        </div>
      </Card>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {filtered.map((job) => (
          <Card key={job._id} className="p-5">
            <div className="flex gap-4">
              <ScoreRing score={job.matchScore ?? 0} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold">{job.title}</h2>
                    <p className="mt-1 font-medium text-violet-700">{job.company}</p>
                  </div>
                  <span className="chip capitalize">{job.workMode}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                  <span className="flex gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.minExperience}+ years
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.slice(0, 7).map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400">
                {job.missingKeywords?.length
                  ? `${job.missingKeywords.length} keyword gaps`
                  : 'Strong keyword coverage'}
              </p>
              <button onClick={() => setSelected(job)} className="btn-primary">
                View & apply
              </button>
            </div>
          </Card>
        ))}
      </div>
      {!filtered.length && (
        <div className="mt-6">
          <Empty title="No matching jobs" description="Change your search or work-mode filter." />
        </div>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          onClick={() => setSelected(null)}
        >
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto p-7">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-violet-600">{selected.company}</p>
                  <h2 className="mt-1 text-2xl font-bold">{selected.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {selected.location} · {selected.workMode} · {selected.employmentType}
                  </p>
                </div>
                <ScoreRing score={selected.matchScore ?? 0} />
              </div>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {selected.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {selected.skills.map((s) => (
                  <span className="chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-7 rounded-xl bg-slate-50 p-4">
                <label className="text-sm font-semibold">
                  Resume used for this application
                  <select
                    className="field mt-2"
                    value={resumeId}
                    onChange={(e) => setResumeId(e.target.value)}
                  >
                    {resumes.map((r) => (
                      <option value={r._id} key={r._id}>
                        {r.name} — {r.score}% ATS
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button className="btn-secondary" onClick={() => setSelected(null)}>
                  Close
                </button>
                <button className="btn-primary" onClick={() => apply(selected)}>
                  <WandSparkles className="h-4 w-4" />
                  Add application
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
