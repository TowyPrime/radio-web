'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { notify } from '@/components/toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify.success('¡Mensaje enviado! Te responderemos pronto.');
    setForm({ name: '', email: '', message: '' });
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Contacto</h1>
      <p className="text-slate-400 text-sm mb-8">
        ¿Tienes una sugerencia, una noticia o quieres pedir una canción? Escríbenos.
      </p>

      <div className="grid gap-6 md:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Correo electrónico</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@correo.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mensaje</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Escribe tu mensaje aquí..."
              className={`${inputClass} resize-none`}
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Enviar mensaje
          </button>
        </form>

        <aside className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 h-fit">
          <h2 className="font-semibold text-white">Datos de la emisora</h2>
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <Mail className="w-4 h-4 text-blue-400 mt-0.5" />
            contacto@ondaradio.example
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <Phone className="w-4 h-4 text-blue-400 mt-0.5" />
            +00 000 000 0000
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
            Calle Principal 123, Ciudad
          </div>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
            Horario de cabina: lunes a domingo, de 6:00 a 24:00.
          </p>
        </aside>
      </div>
    </main>
  );
}
