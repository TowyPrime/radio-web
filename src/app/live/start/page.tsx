'use client';

import { useState } from 'react';
import { Radio, Mic, Square } from 'lucide-react';
import { notify } from '@/components/toast';

export default function StartLivePage() {
  const [title, setTitle] = useState('Hora del vinilo');
  const [description, setDescription] = useState('Clásicos en vinilo para acompañar la tarde.');
  const [onAir, setOnAir] = useState(false);

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';

  const toggle = () => {
    setOnAir((v) => !v);
    notify.success(onAir ? 'Transmisión finalizada' : '¡Estás al aire!');
  };

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Iniciar transmisión en vivo</h1>
      <p className="text-slate-400 text-sm mb-6">Configura tu programa y comienza a transmitir al servidor de streaming.</p>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Estado</span>
          <span
            className={`inline-flex items-center gap-2 text-xs font-bold uppercase px-3 py-1 rounded-full border ${
              onAir
                ? 'bg-red-600/20 text-red-300 border-red-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${onAir ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            {onAir ? 'Al aire' : 'Fuera del aire'}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Nombre del programa</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Descripción</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Servidor</p>
            <p className="text-slate-200">icecast · puerto 8000</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Punto de montaje</p>
            <p className="text-slate-200">/live</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Mic className="w-4 h-4 text-blue-400" />
          Micrófono: Entrada predeterminada
        </div>

        <button
          onClick={toggle}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white transition-colors cursor-pointer ${
            onAir ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          {onAir ? <Square className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
          {onAir ? 'Finalizar transmisión' : 'Iniciar transmisión'}
        </button>
      </section>
    </main>
  );
}
