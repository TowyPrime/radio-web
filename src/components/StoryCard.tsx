"use client";
import { useVisitor } from "@/context/VisitorContext";
import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Send } from "lucide-react";
import type { DemoComment } from "@/data/demo";

interface StoryCardProps {
  title: string;
  content: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorRole?: string;
  fechaCreacion?: string;
  categoria?: string;
  likesCount?: number;
  initialComments?: DemoComment[];
}

export default function StoryCard({
  title,
  content,
  authorName = "Con el pie derecho radio",
  authorAvatar,
  authorRole = "Admin",
  fechaCreacion = "Ahora mismo",
  categoria = "CRÓNICA",
  likesCount = 0,
  initialComments = [],
}: StoryCardProps) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { requireVisitor } = useVisitor();
  const [comments, setComments] = useState<DemoComment[]>(initialComments);
  const [draft, setDraft] = useState("");

  const likes = likesCount + (liked ? 1 : 0);

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();

    if (!text) return;

    const listo = await requireVisitor();
    
    if (!listo) return;

    setComments((prev) => [...prev, { author: "Tú", text, when: "ahora" }]);
    setDraft("");
  };

  const handleLike = async () => {
    const listo = await requireVisitor();

    if (!listo) return;

    setLiked((v) => !v);
  };

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100 max-w-3xl mx-auto w-full transition-all">
      {/* Cabecera: Avatar, Autor, Rol, Fecha y Etiqueta */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          {authorAvatar ? (
            <Image
              src={authorAvatar}
              alt={authorName}
              width={40}
              height={40}
              className="rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-white">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm md:text-base">
                {authorName}
              </span>
              {authorRole && (
                <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  {authorRole}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">{fechaCreacion}</span>
          </div>
        </div>

        {categoria && (
          <span className="border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full tracking-wider">
            {categoria}
          </span>
        )}
      </div>

      {/* Contenido / Cuerpo de la historia */}
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <div className="text-slate-300 text-sm md:text-base leading-relaxed space-y-3 whitespace-pre-line">
          {content}
        </div>
      </div>

      {/* Conteo de reacciones y comentarios */}
      <div className="px-6 py-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span>{likes}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="hover:text-white transition-colors cursor-pointer"
        >
          {comments.length} comentarios
        </button>
      </div>

      {/* Botones de Interacción inferiores */}
      <div className="border-t border-slate-800 grid grid-cols-2 text-center text-sm font-medium text-slate-300 bg-slate-900/50">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          className={`flex items-center justify-center gap-2 py-3 hover:bg-slate-800/80 transition-colors cursor-pointer border-r border-slate-800 ${
            liked ? "text-red-400" : "hover:text-white"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
          />
          <span>Me gusta</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center justify-center gap-2 py-3 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comentar</span>
        </button>
      </div>

      {/* Sección de comentarios */}
      {showComments && (
        <div className="border-t border-slate-800 p-6 space-y-4 bg-slate-950/40">
          {comments.length === 0 && (
            <p className="text-sm text-slate-500">Sé el primero en comentar.</p>
          )}
          {comments.map((c, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                {c.author.charAt(0).toUpperCase()}
              </div>
              <div className="bg-slate-800/60 rounded-2xl px-4 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-white">
                    {c.author}
                  </span>
                  <span className="text-[11px] text-slate-500">{c.when}</span>
                </div>
                <p className="text-sm text-slate-300">{c.text}</p>
              </div>
            </div>
          ))}

          <form onSubmit={addComment} className="flex gap-2 pt-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full transition-colors cursor-pointer"
              aria-label="Enviar comentario"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
