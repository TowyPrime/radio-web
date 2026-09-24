import ChatPanel from '@/components/ChatPanel';
import { demoSchedule } from '@/data/demo';

export default function LivePage() {
  const onAir = demoSchedule.find((s) => s.live);

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-1">Nuestra Emisora en Vivo</h1>
      <p className="text-slate-400 text-sm mb-8">
        Escucha la transmisión, conversa con el locutor y consulta la programación del día.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna izquierda: programa actual + programación */}
        <div className="lg:col-span-3 space-y-6">
          {onAir && (
            <section className="rounded-2xl p-6 bg-gradient-to-br from-blue-700 to-indigo-950 border border-blue-500/30 shadow-xl">
              <span className="inline-flex items-center gap-2 bg-red-600/20 text-red-300 border border-red-500/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Al aire
              </span>
              <h2 className="text-3xl font-bold text-white mt-4">{onAir.name}</h2>
              <p className="text-blue-200 mt-1">con {onAir.host} · desde las {onAir.time}</p>
              <p className="text-sm text-blue-100/80 mt-4 max-w-md">
                Pulsa el botón de reproducir del reproductor superior para sintonizar la emisora.
              </p>
            </section>
          )}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Programación de hoy</h2>
            <ul className="divide-y divide-slate-800">
              {demoSchedule.map((show) => (
                <li key={show.time} className="flex items-center gap-4 py-3">
                  <span className="w-14 text-sm font-mono text-slate-400">{show.time}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${show.live ? 'text-white' : 'text-slate-200'}`}>{show.name}</p>
                    <p className="text-xs text-slate-500">{show.host}</p>
                  </div>
                  {show.live && (
                    <span className="text-[10px] font-bold uppercase text-red-400 bg-red-600/20 border border-red-500/30 px-2 py-0.5 rounded-full">
                      En vivo
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Columna derecha: chat */}
        <div className="lg:col-span-2">
          <ChatPanel className="h-[32rem]" />
        </div>
      </div>
    </main>
  );
}
