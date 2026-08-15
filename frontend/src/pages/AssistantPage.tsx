import { useEffect, useRef, useState } from 'react';
import { Bot, Send, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { Card, Empty, PageHeader } from '../components/ui';
import type { Resume } from '../types';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ label: string; excerpt: string }>;
};
type Conversation = { _id: string; title: string; messages: Message[] };

export function AssistantPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [resumeId, setResumeId] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [r, c] = await Promise.all([api.get('/resumes'), api.get('/assistant/conversations')]);
    setResumes(r.data.resumes);
    setResumeId((x) => x || r.data.resumes[0]?._id || '');
    setConversations(c.data.conversations);
    setSelected((x) => x ?? c.data.conversations[0] ?? null);
  };

  useEffect(() => {
    async function init() {
      await load();
    }
    void init();
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !resumeId) return;
    setBusy(true);
    try {
      const { data } = await api.post('/assistant/chat', {
        resumeId,
        message: text,
        conversationId: selected?._id,
      });
      setSelected(data.conversation);
      setText('');
      await load();
      setSelected(data.conversation);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="RAG career copilot"
        title="Ask your resume, not the internet"
        description="Answers are grounded in your uploaded document and include the exact supporting resume chunks."
      />

      <div className="grid min-h-[680px] gap-5 xl:grid-cols-[300px_1fr]">
        <Card className="p-4 min-h-[680px] overflow-y-auto">
          <button onClick={() => setSelected(null)} className="btn-primary w-full">
            + New conversation
          </button>

          <div className="mt-4 space-y-2">
            {conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelected(c)}
                className={`w-full rounded-xl p-3 text-left text-sm ${selected?._id === c._id ? 'bg-violet-50 font-semibold text-violet-800' : 'hover:bg-slate-50'}`}
              >
                <p className="truncate">{c.title}</p>
                <p className="mt-1 text-xs font-normal text-slate-400">
                  {c.messages.length} messages
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex min-h-[680px] flex-col overflow-hidden">
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-50 text-violet-700">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Assistant</div>
                  <div className="text-xs text-slate-400">
                    Grounded answers from selected resume
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="field"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                >
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex grow flex-col gap-3 overflow-y-auto p-4">
            {selected ? (
              selected.messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`rounded-lg p-3 ${m.role === 'assistant' ? 'bg-slate-100' : 'bg-violet-600 text-white'}`}
                  >
                    <div className="text-sm">{m.content}</div>
                  </div>
                </div>
              ))
            ) : (
              <Empty
                title="No conversation"
                description="Start a new conversation to ask your resume questions."
              />
            )}

            <div ref={bottom} />
          </div>

          <form onSubmit={send} className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <input
                className="field flex-1"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask a question about your resume..."
              />
              <button className="btn" disabled={busy}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
