import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, login, googleLogin, register } = useAuth();
  const googleButton = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: 'virendra.arekar@gmail.com',
    password: 'CareerPilot@123',
    role: 'candidate',
  });
  useEffect(() => {
    if (!googleClientId || !googleButton.current) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          try {
            await googleLogin(credential);
            toast.success('Signed in with Google');
          } catch (e) {
            toast.error(errorMessage(e));
          }
        },
      });
      if (googleButton.current)
        window.google?.accounts.id.renderButton(googleButton.current, {
          theme: 'outline',
          size: 'large',
          width: 420,
        });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [googleClientId, googleLogin]);
  if (user) return <Navigate to="/" replace />;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      mode === 'login' ? await login(form.email, form.password) : await register(form);
      toast.success('Welcome to CareerPilot AI');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#7c3aed55,transparent_35%),radial-gradient(circle_at_85%_75%,#06b6d455,transparent_30%)]" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 font-black">
            CP
          </div>
          <p className="text-xl font-bold">CareerPilot AI</p>
        </div>
        <div className="relative max-w-xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-violet-300" />
            Built for ambitious engineering careers
          </span>
          <h1 className="text-6xl font-black leading-[1.04] tracking-tight">
            Your career data,
            <br />
            <span className="text-violet-400">working harder.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Analyse resumes, discover high-fit roles, practise interviews and manage every
            application in one intelligent workspace.
          </p>
          <div className="mt-9 grid grid-cols-2 gap-4">
            {[
              'Source-grounded RAG assistant',
              'Truthful ATS optimisation',
              'Role-specific mock interviews',
              'Recruiter intelligence',
            ].map((x) => (
              <div key={x} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {x}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">
          MERN · OpenAI Responses API · MongoDB · TypeScript
        </p>
      </section>
      <section className="grid place-items-center bg-white p-6">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 lg:hidden">
            <Bot />
          </div>
          <p className="text-sm font-bold text-violet-600">CAREERPILOT AI</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to continue your career journey.'
              : 'Start with a secure, private candidate profile.'}
          </p>
          {googleClientId && (
            <>
              <div ref={googleButton} className="mt-6 min-h-11" />
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or use email
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}
          <div className={googleClientId ? 'space-y-4' : 'mt-8 space-y-4'}>
            {mode === 'register' && (
              <>
                <label className="block text-sm font-semibold">
                  Full name
                  <input
                    className="field mt-2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Account type
                  <select
                    className="field mt-2"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="candidate">Candidate</option>
                    <option value="recruiter">Recruiter</option>
                  </select>
                </label>
              </>
            )}
            <label className="block text-sm font-semibold">
              Email
              <input
                type="email"
                className="field mt-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input
                type="password"
                className="field mt-2"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </label>
            <button disabled={busy} className="btn-primary w-full py-3">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="mt-6 w-full text-sm font-semibold text-violet-700"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
          </button>
          <div className="mt-8 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            Seed login: virendra.arekar@gmail.com / CareerPilot@123. Change it after local setup.
          </div>
        </form>
      </section>
    </div>
  );
}
