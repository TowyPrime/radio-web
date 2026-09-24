import ChatPanel from '@/components/ChatPanel';

export default function ChatPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Chat en vivo</h1>
      <p className="text-slate-400 text-sm mb-6">
        Conversa con el locutor y con otros oyentes mientras escuchas la transmisión.
      </p>
      <ChatPanel className="h-[60vh]" />
    </main>
  );
}
