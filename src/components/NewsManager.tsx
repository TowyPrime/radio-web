"use client";

import { NewsRecord } from "@/lib/news/types";
import { useState } from "react";
import NewsEditor from "@/components/NewsEditor";
import {
  NEWS_CATEGORIES,
  NEWS_LIMITS,
  MAX_COVER_BYTES,
  NEWS_BUCKET_NAME,
} from "@/lib/news/constants";
import { ALLOWED_IMAGE_TYPES } from "@/lib/news/constants";
import { notify } from "./toast";
import { AppError } from "@/data/AppError";
import { createClient } from "@/utils/supabase/client";

interface NewsManagerProps {
  initialNews: NewsRecord[];
}

export default function NewsManager({ initialNews }: NewsManagerProps) {
  const [newsList, setNewsList] = useState<NewsRecord[]>(initialNews);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<string>(NEWS_CATEGORIES[0]);
  const [content, setContent] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState<number>(0);

  const resetForm = () => {
    setTitle("");
    setSummary("");
    setContent("");
    setCategory(NEWS_CATEGORIES[0]);
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCover(false);
    if (coverPreview  && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
  };

  const openCreate = () => {
    resetForm();
    setEditingId(null);
    setFormVersion((v) => v + 1);
    setIsFormOpen(true);
  };

  const openEdit = (news: NewsRecord) => {
    setTitle(news.title);
    setSummary(news.summary);
    setCategory(news.category);
    setContent(news.body);
    setCoverFile(null);
    setCoverPreview(news.cover_url);
    setRemoveCover(false);
    setEditingId(news.id);
    setFormVersion((v) => v + 1);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    resetForm();
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      notify.error("El tipo de archivo no es válido");
      return;
    }

    if (file.size > MAX_COVER_BYTES) {
      notify.error(`El archivo debe tener como máximo ${MAX_COVER_BYTES/(1024 *1024)}`);
      return;
    }

    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  };

  const handleRemoveCover = () => {
    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCover(true);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;

  const trimmedTitle = title.trim();
  const trimmedSummary = summary.trim();
  const plainContent = content.replace(/<[^>]*>/g, "").trim();
 
  if(!trimmedTitle  || trimmedTitle.length > NEWS_LIMITS.title ){
    notify.error(`El titulo es obligatorio y debe tener máximo ${NEWS_LIMITS.title} caracteres.`);
    return;
  }
  if(!trimmedSummary || trimmedSummary.length > NEWS_LIMITS.summary ){
    notify.error(`El resumen es obligatorio y debe tener máximo ${NEWS_LIMITS.summary} caracteres`)
    return;
  }
  if(!plainContent){
    notify.error("El contenido es obligatorio");
    return;
  }

  setIsSubmitting(true);

  try {
    let uploadedPath: string | null = null;

    if (coverFile) {
      const coverType = coverFile.type
      const uploadResponse = await fetch('/api/admin/news/upload-url', {
        method:'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageType:coverType }),
      });
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new AppError(uploadData?.error || "No se pudo generar la url de subida");
      }

      const { token, path } = uploadData;

    
      const supabase = createClient();
      const { error: storageError } = await supabase.storage
        .from(NEWS_BUCKET_NAME)
        .uploadToSignedUrl(path, token, coverFile, { contentType: coverFile.type });

      if (storageError) {
        console.error("Detalle técnico de Storage:", storageError);
        throw new AppError("Hubo un problema al subir el archivo al almacenamiento. Inténtalo de nuevo.");
      }

      uploadedPath = path;
    }

    
    const payload: Record<string, unknown> = {
      title: trimmedTitle,
      summary: trimmedSummary,
      category,
      content,
    };

    if(uploadedPath){
      payload.cover_path = uploadedPath;
    }
    if(removeCover){
      payload.cover_path = null
    }

    const isEditing = editingId !== null;
    const response = await fetch(
      isEditing ? `/api/admin/news/${editingId}` : "/api/admin/news",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      throw new AppError(data?.error || "Error al guardar la noticia");
    }

    setNewsList((prev) =>
    isEditing ? prev.map((item) =>(item.id === editingId ? data.news: item))
    : [data.news, ...prev]
    );
    closeForm();
    notify.success(isEditing ? "La noticia fue editada con exito": "La noticia fue creada con exito");
  } catch (error: unknown) {
    console.error("Error al guardar noticia", error);
      const errorMessage =
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.";

      notify.error(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

const handleDelete = async (id: string) => {
  const confirmed = window.confirm(
    "¿Está seguro de borrar esta noticia?, esta acción no se puede revertir",
  );
  if(!confirmed) return;

  setDeletingId(id);

  try {
  
    const response = await fetch(`/api/admin/news/${id}`,{method: "DELETE"});

    const data = await response.json();

    if(!response.ok){
      throw new AppError(data.error || "Ocurrió un problema al borrar la noticia");
    }

    setNewsList((prevNews) => prevNews.filter((news)=> news.id !== id));
    notify.success("La noticia fue eliminada con exito");
  } catch (error: unknown) {
    console.error("Error al eliminar la noticia:", error);
      const errorMessage =
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.";

      notify.error(errorMessage);
  } finally {
    setDeletingId(null);
  }
};
return (
  <div className="max-w-6xl mx-auto mt-10 p-6 bg-slate-900 rounded-lg shadow-lg border border-slate-800 space-y-6">
    {/* Encabezado principal */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Noticias</h1>
        <p className="text-slate-400 text-sm">
          Administra las publicaciones y novedades del sitio.
        </p>
      </div>
      {!isFormOpen && (
        <button
          type="button"
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
        >
          Nueva noticia
        </button>
      )}
    </div>

    {/* Formulario desplegable con estilo de 2 columnas */}
    {isFormOpen && (
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">
          {editingId !== null ? "Editar noticia" : "Crear nueva noticia"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Columna Izquierda: Portada + Campos principales */}
          <div className="md:col-span-2 space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={NEWS_LIMITS.title}
                placeholder="Título de la noticia"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Resumen */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Resumen</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={NEWS_LIMITS.summary}
                rows={3}
                placeholder="Breve descripción de la noticia..."
                className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500 text-sm"
              >
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Editor */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contenido</label>
              <div className="bg-slate-800 rounded border border-slate-700 p-2">
                <NewsEditor 
                  key={`${editingId ?? "new"}-${formVersion}`} 
                  value={content} 
                  onChange={setContent} 
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Portada, Vista Previa y Botones */}
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Imagen de Portada
              </h3>
              
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
              />

              {coverPreview && (
                <div className="space-y-3 pt-2">
                  <div className="w-full h-36 rounded overflow-hidden bg-slate-900 border border-slate-700">
                    <img
                      src={coverPreview}
                      alt="Vista previa de portada"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="w-full bg-red-900/40 hover:bg-red-900/70 text-red-200 text-xs font-medium py-1.5 px-3 rounded border border-red-800/50 transition-colors"
                  >
                    Quitar portada
                  </button>
                </div>
              )}
            </div>

            {/* Acciones de formulario */}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2 rounded text-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar Noticia"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium p-2 rounded text-sm transition-colors border border-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>

        </form>
      </div>
    )}

    {/* Listado de tarjetas de noticias */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {newsList.map((news) => (
        <div key={news.id} className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            {news.cover_url && (
              <div className="h-44 w-full overflow-hidden bg-slate-800">
                <img
                  src={news.cover_url}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4 space-y-2">
              <span className="inline-block bg-blue-900/40 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded text-xs font-semibold">
                {news.category}
              </span>
              <h3 className="text-base font-bold text-white line-clamp-2">{news.title}</h3>
              <p className="text-slate-400 text-xs line-clamp-3">{news.summary}</p>
            </div>
          </div>

          <div className="p-4 pt-0 flex items-center justify-end gap-2 border-t border-slate-700/50 mt-4">
            <button
              type="button"
              onClick={() => openEdit(news)}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(news.id)}
              disabled={deletingId === news.id}
              className="bg-red-900/40 hover:bg-red-900/70 text-red-200 text-xs font-medium py-1.5 px-3 rounded border border-red-800/50 transition-colors disabled:opacity-50"
            >
              {deletingId === news.id ? "Borrando..." : "Borrar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}
