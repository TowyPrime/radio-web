'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { demoChat, type DemoChatMessage } from '@/data/demo';
import { useVisitor } from "@/context/VisitorContext";

interface ChatPanelProps {
  className?: string;
}

export default function ChatPanel({ className = '' }: ChatPanelProps) {
  const [messages, setMessages] = useState<DemoChatMessage[]>(demoChat);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const {requireVisitor} = useVisitor();

  // Desplaza solo la caja del chat (scrollIntoView movería también toda la página)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const listo = await requireVisitor();

    if(!listo) return;
    
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: prev.length + 1, author: 'Tú', text, time, mine: true }]);
    setDraft('');
  };

  return (
    <section className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <h2 className="font-semibold text-white">Chat en vivo</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-4 h-4" />
          124 oyentes
        </span>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className={`text-xs font-semibold ${m.role === 'locutor' ? 'text-red-400' : 'text-blue-400'}`}>
                {m.author}
              </span>
              {m.role === 'locutor' && (
                <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] uppercase font-bold px-1.5 py-px rounded-full">
                  Locutor
                </span>
              )}
              <span className="text-[10px] text-slate-500">{m.time}</span>
            </div>
            <p
              className={`text-sm px-3.5 py-2 rounded-2xl max-w-[85%] ${
                m.mine ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 p-3 border-t border-slate-800">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full transition-colors cursor-pointer"
          aria-label="Enviar mensaje"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}
