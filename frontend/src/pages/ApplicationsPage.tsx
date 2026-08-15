import { useState } from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { Card, Empty, Loading, PageHeader } from '../components/ui';
import { useApi } from '../hooks/useApi';
import type { Application } from '../types';

const stages = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected'];
export function ApplicationsPage() {
  const { data, loading, reload } = useApi<Application[]>(
    async () => (await api.get('/applications')).data.applications,
    []
  );
  const update = async (id: string, status: string) => {
    await api.patch(`/applications/${id}`, { status });
    await reload();
    toast.success(`Moved to ${status}`);
  };
  const remove = async (id: string) => {
    await api.delete(`/applications/${id}`);
    await reload();
  };
  if (loading) return <Loading />;
  return (
    <>
      <PageHeader
        eyebrow="Job search CRM"
        title="Application pipeline"
        description="Move each opportunity through your live workflow and keep next actions visible."
      />
      {!data?.length ? (
        <Empty
          title="Your pipeline is empty"
          description="Open Job Matches and add your first application."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
          {stages.map((stage) => (
            <div key={stage}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold capitalize">{stage}</h2>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                  {data.filter((x) => x.status === stage).length}
                </span>
              </div>
              <div className="space-y-3">
                {data
                  .filter((x) => x.status === stage)
                  .map((item) => (
                    <Card key={item._id} className="p-4">
                      <p className="text-xs font-semibold text-violet-600">{item.job.company}</p>
                      <h3 className="mt-1 font-bold leading-5">{item.job.title}</h3>
                      <p className="mt-3 text-xs text-slate-500">Match {item.matchScore}%</p>
                      {item.nextActionAt && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {new Date(item.nextActionAt).toLocaleDateString()}
                        </p>
                      )}
                      <select
                        className="field mt-4 !py-2 !text-xs"
                        value={item.status}
                        onChange={(e) => update(item._id, e.target.value)}
                      >
                        {stages.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => remove(item._id)}
                        className="mt-3 flex items-center gap-1 text-xs text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
