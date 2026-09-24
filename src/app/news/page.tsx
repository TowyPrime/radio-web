import { Clock } from 'lucide-react';
import { demoNews } from '@/data/demo';

export default function NewsPage() {
  const [featured, ...rest] = demoNews;

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Noticias</h1>

      {/* Noticia destacada */}
      <article className={`rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 grid md:grid-cols-2 mb-8`}>
        <div className={`min-h-52 bg-gradient-to-br ${featured.gradient}`} />
        <div className="p-6 md:p-8 flex flex-col justify-center gap-3">
          <span className="text-xs font-bold tracking-wider text-blue-400">{featured.category}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{featured.title}</h2>
          <p className="text-slate-400">{featured.summary}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
            <span>{featured.author}</span>
            <span>·</span>
            <span>{featured.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.readTime}</span>
          </div>
        </div>
      </article>

      {/* Resto de noticias */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((n) => (
          <article
            key={n.id}
            className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col hover:border-slate-700 transition-colors"
          >
            <div className={`h-36 bg-gradient-to-br ${n.gradient}`} />
            <div className="p-5 flex flex-col gap-2 flex-1">
              <span className="text-[11px] font-bold tracking-wider text-blue-400">{n.category}</span>
              <h3 className="text-lg font-semibold text-white leading-snug">{n.title}</h3>
              <p className="text-sm text-slate-400 flex-1">{n.summary}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
                <span>{n.author}</span>
                <span>·</span>
                <span>{n.date}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
