import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Plus, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { Card, Empty, PageHeader, ScoreRing } from '../components/ui';
import type { Application } from '../types';

type RecruiterData = {
  jobs: Array<{ _id: string; title: string; status: string }>;
  applications: Application[];
  totals: { jobs: number; applications: number; candidates: number };
};
export function RecruiterPage() {
  const [data, setData] = useState<RecruiterData | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: 'Remote',
    workMode: 'remote',
    employmentType: 'Full-time',
    description: '',
    skills: '',
    minExperience: 5,
  });
  const load = async () => setData((await api.get('/analytics/recruiter')).data);
  useEffect(() => {
    void load();
  }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/jobs', {
        ...form,
        skills: form.skills
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      });
      setOpen(false);
      await load();
      toast.success('Job published');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const cards = [
    { label: 'Published jobs', value: data?.totals.jobs ?? 0, Icon: BriefcaseBusiness },
    { label: 'Applications', value: data?.totals.applications ?? 0, Icon: UsersRound },
    { label: 'Candidate pool', value: data?.totals.candidates ?? 0, Icon: UsersRound },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Recruitment intelligence"
        title="Recruiter workspace"
        description="Publish live roles and review candidates ranked by their calculated resume match."
        actions={
          <button onClick={() => setOpen(!open)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Create job
          </button>
        }
      />
      {open && (
        <Card className="mb-6 p-6">
          <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
            <input
              className="field"
              placeholder="Job title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <select
              className="field"
              value={form.workMode}
              onChange={(e) => setForm({ ...form, workMode: e.target.value })}
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
            <input
              className="field"
              type="number"
              min="0"
              placeholder="Minimum experience"
              value={form.minExperience}
              onChange={(e) => setForm({ ...form, minExperience: Number(e.target.value) })}
            />
            <input
              className="field"
              placeholder="Skills, comma separated"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <textarea
              className="field min-h-32 md:col-span-2"
              placeholder="Full job description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <button className="btn-primary md:col-span-2">Publish job</button>
          </form>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, Icon }) => (
          <Card className="p-5" key={label}>
            <Icon className="h-5 w-5 text-violet-600" />
            <p className="mt-4 text-3xl font-bold">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold">Ranked candidates</h2>
        </div>
        {data?.applications.length ? (
          <div className="divide-y divide-slate-100">
            {data.applications.map((a) => (
              <div
                key={a._id}
                className="grid items-center gap-4 p-5 md:grid-cols-[1fr_1fr_100px_140px]"
              >
                <div>
                  <p className="font-bold">{a.user?.name}</p>
                  <p className="text-xs text-slate-500">{a.user?.headline}</p>
                </div>
                <div>
                  <p className="font-semibold">{a.job.title}</p>
                  <p className="text-xs text-slate-500">{a.job.company}</p>
                </div>
                <ScoreRing score={a.matchScore} size="sm" />
                <select
                  className="field !py-2"
                  value={a.status}
                  onChange={async (e) => {
                    await api.patch(`/applications/${a._id}`, { status: e.target.value });
                    await load();
                  }}
                >
                  {['applied', 'screening', 'interview', 'offer', 'rejected'].map((x) => (
                    <option value={x} key={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <Empty
              title="No candidate applications"
              description="Published roles and incoming candidates will appear here."
            />
          </div>
        )}
      </Card>
    </>
  );
}
