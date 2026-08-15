import { useEffect, useRef, useState } from 'react';
import { Camera, Download, ExternalLink, FileText, Mail, MapPin, Phone, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { ASSET_ROOT, api, errorMessage } from '../api/client';
import { Card, Loading, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

export function ProfilePage() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const photo = useRef<HTMLInputElement>(null);
  const resume = useRef<HTMLInputElement>(null);
  const load = async () => setProfile((await api.get('/profile')).data.profile);
  useEffect(() => {
    void load();
  }, []);
  const save = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      await api.patch('/profile', {
        name: profile.name,
        headline: profile.headline,
        location: profile.location,
        phone: profile.phone,
        linkedin: profile.linkedin,
        summary: profile.summary,
        skills: profile.skills,
        education: profile.education,
        experience: profile.experience,
      });
      await refresh();
      setEditing(false);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const upload = async (type: 'photo' | 'resume') => {
    const file = (type === 'photo' ? photo : resume).current?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append(type, file);
    try {
      await api.post(`/profile/${type}`, form);
      await load();
      await refresh();
      toast.success(`${type} uploaded`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  if (!profile) return <Loading />;
  return (
    <>
      <PageHeader
        eyebrow="Professional portfolio"
        title="About me"
        description="This page is fully profile-driven. Edit details, upload your own photo and keep the visible resume current."
        actions={
          <button
            className={editing ? 'btn-primary' : 'btn-secondary'}
            onClick={() => (editing ? save() : setEditing(true))}
          >
            {editing ? (
              <>
                <Save className="h-4 w-4" />
                {busy ? 'Saving…' : 'Save profile'}
              </>
            ) : (
              'Edit profile'
            )}
          </button>
        }
      />
      <Card className="overflow-hidden">
        <div className="h-40 bg-[radial-gradient(circle_at_20%_10%,#a78bfa,transparent_35%),linear-gradient(125deg,#111827,#312e81)]" />
        <div className="px-6 pb-7 md:px-9">
          <div className="-mt-16 flex flex-col gap-5 md:flex-row md:items-end">
            <div className="relative h-32 w-32 shrink-0 rounded-3xl border-4 border-white bg-violet-100 shadow-lg">
              {profile.photoUrl ? (
                <img
                  className="h-full w-full rounded-[20px] object-cover"
                  src={`${ASSET_ROOT}${profile.photoUrl}`}
                />
              ) : (
                <div className="grid h-full place-items-center text-4xl font-black text-violet-700">
                  {profile.name
                    .split(' ')
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
              <button
                onClick={() => photo.current?.click()}
                className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white shadow"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={photo}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={() => upload('photo')}
              />
            </div>
            <div className="flex-1 pb-1">
              {editing ? (
                <>
                  <input
                    className="field max-w-lg text-xl font-bold"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                  <input
                    className="field mt-2 max-w-2xl"
                    value={profile.headline}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <p className="mt-1 text-sm font-medium text-violet-700">{profile.headline}</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {profile.email}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {profile.phone}
            </span>
            {profile.linkedin && (
              <a
                target="_blank"
                href={profile.linkedin}
                className="flex items-center gap-2 text-violet-700"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold">Professional summary</h2>
            {editing ? (
              <textarea
                className="field mt-4 min-h-36"
                value={profile.summary}
                onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              />
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-600">{profile.summary}</p>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-bold">Experience</h2>
            <div className="mt-5 space-y-6">
              {profile.experience?.map((x, i) => (
                <div
                  key={`${x.company}-${i}`}
                  className="relative border-l-2 border-violet-200 pl-5"
                >
                  <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-violet-600" />
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{x.role}</h3>
                      <p className="text-sm font-semibold text-violet-700">{x.company}</p>
                    </div>
                    <span className="text-xs text-slate-400">{x.period}</span>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                    {x.highlights?.map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold">Core skills</h2>
            {editing ? (
              <textarea
                className="field mt-4 min-h-28"
                value={profile.skills.join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span className="chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-bold">Education</h2>
            <div className="mt-4 space-y-3">
              {profile.education.map((e) => (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600" key={e}>
                  {e}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-bold">Resume</h2>
            {profile.resumeUrl ? (
              <a
                className="mt-4 flex items-center gap-3 rounded-xl bg-violet-50 p-4 text-sm font-semibold text-violet-800"
                href={`${ASSET_ROOT}${profile.resumeUrl}`}
                target="_blank"
              >
                <FileText className="h-5 w-5" />
                <span className="min-w-0 flex-1 truncate">Current professional resume</span>
                <Download className="h-4 w-4" />
              </a>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No resume attached.</p>
            )}
            <button onClick={() => resume.current?.click()} className="btn-secondary mt-4 w-full">
              Upload replacement
            </button>
            <input
              ref={resume}
              type="file"
              accept=".pdf,.docx,.txt"
              hidden
              onChange={() => upload('resume')}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
