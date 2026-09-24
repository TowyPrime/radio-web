'use client';

import { useState } from 'react';
import { Music, UploadCloud, Trash2 } from 'lucide-react';
import { notify } from '@/components/toast';
import { demoTracks, type DemoTrack } from '@/data/demo';

export default function SaveMusicPage() {
  const [tracks, setTracks] = useState<DemoTrack[]>(demoTracks);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    setTracks((prev) => [
      { id: `t${Date.now()}`, title: title.trim(), artist: artist.trim(), duration: '3:30' },
      ...prev,
    ]);
    notify.success('Canción guardada en la biblioteca');
    setTitle('');
    setArtist('');
    setFileName(null);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Guardar música</h1>
      <p className="text-slate-400 text-sm mb-6">Sube canciones a la biblioteca de la emisora para usarlas en tus playlists.</p>

      <div className="grid gap-6 md:grid-cols-5">
        <form onSubmit={handleSubmit} className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl py-8 text-center cursor-pointer transition-colors">
            <UploadCloud className="w-8 h-8 text-blue-400" />
            <span className="text-sm text-slate-300">{fileName ?? 'Selecciona un archivo de audio'}</span>
            <span className="text-xs text-slate-500">MP3, WAV u OGG</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className={inputClass} />
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artista" className={inputClass} />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Guardar canción
          </button>
        </form>

        <section className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Biblioteca ({tracks.length})</h2>
          <ul className="divide-y divide-slate-800">
            {tracks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.title}</p>
                  <p className="text-xs text-slate-500 truncate">{t.artist}</p>
                </div>
                <span className="text-xs text-slate-500">{t.duration}</span>
                <button
                  onClick={() => setTracks((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  aria-label={`Eliminar ${t.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
