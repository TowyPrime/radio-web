'use client';

import { useState } from 'react';
import { Check, ListMusic } from 'lucide-react';
import { notify } from '@/components/toast';
import { demoPlaylists, demoTracks } from '@/data/demo';

export default function CreatePlaylistPage() {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState(demoPlaylists);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selected.size === 0) {
      notify.warning('Ponle un nombre y elige al menos una canción');
      return;
    }
    setPlaylists((prev) => [{ id: `p${Date.now()}`, name: name.trim(), tracks: selected.size }, ...prev]);
    notify.success('Playlist creada');
    setName('');
    setSelected(new Set());
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Crear playlist</h1>
      <p className="text-slate-400 text-sm mb-6">Arma una lista con la música de la biblioteca para reproducirla al aire.</p>

      <div className="grid gap-6 md:grid-cols-5">
        <form onSubmit={handleSubmit} className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la playlist"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />

          <ul className="divide-y divide-slate-800">
            {demoTracks.map((t) => {
              const isOn = selected.has(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="w-full flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        isOn ? 'bg-blue-600 border-blue-600' : 'border-slate-600'
                      }`}
                    >
                      {isOn && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-white truncate">{t.title}</span>
                      <span className="block text-xs text-slate-500 truncate">{t.artist}</span>
                    </span>
                    <span className="text-xs text-slate-500">{t.duration}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Crear playlist ({selected.size} canciones)
          </button>
        </form>

        <section className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
          <h2 className="font-semibold text-white mb-4">Mis playlists</h2>
          <ul className="space-y-3">
            {playlists.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center">
                  <ListMusic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.tracks} canciones</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
