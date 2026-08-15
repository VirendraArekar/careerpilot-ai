import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileCheck2,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card, Loading, PageHeader, ScoreRing } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

type Dashboard = { stats: Record<string, number>; applicationsByStatus: Record<string, number> };
export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading } = useApi<Dashboard>(
    async () => (await api.get('/analytics/dashboard')).data,
    []
  );
  if (loading || !data) return <Loading label="Building your dashboard" />;
  const chart = Object.entries(data.applicationsByStatus).map(([name, value]) => ({ name, value }));
  const cards = [
    {
      label: 'Resume ATS',
      value: `${data.stats.atsScore}%`,
      icon: FileCheck2,
      color: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Applications',
      value: data.stats.applications,
      icon: BriefcaseBusiness,
      color: 'bg-cyan-100 text-cyan-700',
    },
    {
      label: 'Interview score',
      value: `${data.stats.interviewScore}%`,
      icon: MessageSquareText,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'AI actions',
      value: data.stats.aiCalls,
      icon: Sparkles,
      color: 'bg-emerald-100 text-emerald-700',
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Career command centre"
        title={`Good to see you, ${user?.name.split(' ')[0]}`}
        description="Live progress from your resumes, applications, interviews and AI workflows."
        actions={
          <Link to="/jobs" className="btn-primary">
            Explore matches
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Application pipeline</h2>
              <p className="text-sm text-slate-500">Current stages across your job search</p>
            </div>
          </div>
          {chart.length ? (
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-sm text-slate-500">
              Save or apply to a job to start your pipeline.
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold">Readiness</h2>
          <div className="mt-6 flex items-center gap-5">
            <ScoreRing score={data.stats.atsScore} />
            <div>
              <p className="font-semibold">Latest resume</p>
              <p className="mt-1 text-sm text-slate-500">Your current ATS foundation.</p>
              <Link
                to="/resumes"
                className="mt-3 inline-flex text-sm font-semibold text-violet-700"
              >
                Improve resume →
              </Link>
            </div>
          </div>
          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            {[
              ['Open matching jobs', data.stats.openJobs],
              ['Mock interviews', data.stats.interviews],
              ['Coding attempts', data.stats.codingAttempts],
              ['AI tokens used', data.stats.aiTokens],
            ].map(([label, value]) => (
              <div className="flex justify-between text-sm" key={String(label)}>
                <span className="text-slate-500">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
