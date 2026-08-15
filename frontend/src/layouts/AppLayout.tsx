import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Code2,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  NotebookPen,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { ASSET_ROOT } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/ui';

const links = [
  ['/', 'Overview', LayoutDashboard],
  ['/resumes', 'Resume Studio', FileText],
  ['/jobs', 'Job Matches', BriefcaseBusiness],
  ['/applications', 'Applications', ChartNoAxesCombined],
  ['/assistant', 'Career Assistant', MessageSquareText],
  ['/cover-letters', 'Cover Letters', NotebookPen],
  ['/interviews', 'Interview Lab', Sparkles],
  ['/coding', 'Coding Studio', Code2],
  ['/profile', 'About Me', UserRound],
] as const;

export function AppLayout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <Loading label="Opening your workspace" />;
  if (!user) return <Navigate to="/login" replace />;
  const nav =
    user.role === 'candidate'
      ? links
      : [...links, ['/recruiter', 'Recruiter', UsersRound] as const];
  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-[#111827] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 font-black">
              CP
            </div>
            <div>
              <p className="font-bold">CareerPilot AI</p>
              <p className="text-xs text-slate-400">Career intelligence</p>
            </div>
          </div>
          <nav className="mt-3 flex-1 overflow-y-auto grid grid-cols-2 gap-1 sm:grid-cols-4 lg:block lg:space-y-1">
            {nav.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto hidden rounded-2xl bg-white/5 p-3 lg:block flex-shrink-0">
            <div className="flex items-center gap-3">
              {user.photoUrl ? (
                <img
                  className="h-10 w-10 rounded-xl object-cover"
                  src={`${ASSET_ROOT}${user.photoUrl}`}
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 font-bold">
                  {user.name[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-[1500px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
