"use client";

import { useState } from "react";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { notify } from "@/components/toast";
import { AppError } from "@/data/AppError";
import { Button, buttonVariants } from "@/components/ui/button";
import { CONTACT_MESSAGES_CHANGED_EVENT } from "@/lib/contact/constants";
import type { ContactMessage } from "@/lib/contact/types";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: STATION_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

interface MessagesManagerProps {
  initialMessages: ContactMessage[];
}

export default function MessagesManager({
  initialMessages,
}: MessagesManagerProps) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const unreadCount = messages.filter((m) => m.read_at === null).length;
  const visibleMessages = onlyUnread
    ? messages.filter((m) => m.read_at === null)
    : messages;

  const notifyMenu = () =>
    window.dispatchEvent(new Event(CONTACT_MESSAGES_CHANGED_EVENT));

  const handleToggleRead = async (message: ContactMessage) => {
    const id = message.id;
    const markAsRead = message.read_at === null;

    setBusyId(id);

    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: markAsRead }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new AppError(data?.error || "No se pudo actualizar el mensaje");
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, read_at: data?.message?.read_at ?? null } : m,
        ),
      );
      notifyMenu();
    } catch (error: unknown) {
      if (!(error instanceof AppError)) {
        console.error("Error al actualizar el mensaje:", error);
      }

      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (message: ContactMessage) => {
    const id = message.id;

    const confirmed = window.confirm(
      `¿Borrar el mensaje de ${message.name}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setBusyId(id);

    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new AppError(data?.error || "No se pudo borrar el mensaje");
      }

      setMessages((prev) => prev.filter((m) => m.id !== id));
      notify.success("Mensaje borrado");
      notifyMenu();
    } catch (error: unknown) {
      if (!(error instanceof AppError)) {
        console.error("Error al borrar el mensaje:", error);
      }

      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-white">Mensajes</h1>
          <p className="text-sm text-ink-400">
            Mensajes enviados desde el formulario de contacto
            {unreadCount > 0 ? ` · ${unreadCount} sin leer` : ""}.
          </p>
        </div>

        <div className="flex gap-2" role="group" aria-label="Filtrar mensajes">
          <Button
            type="button"
            size="sm"
            variant={onlyUnread ? "secondary" : "default"}
            onClick={() => setOnlyUnread(false)}
            aria-pressed={!onlyUnread}
          >
            Todos ({messages.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={onlyUnread ? "default" : "secondary"}
            onClick={() => setOnlyUnread(true)}
            aria-pressed={onlyUnread}
          >
            Sin leer ({unreadCount})
          </Button>
        </div>
      </div>

      {visibleMessages.length === 0 ? (
        <div className="rounded-2xl border border-ink-800 bg-ink-900/50 py-16 text-center">
          <p className="text-ink-400">
            {onlyUnread
              ? "No tienes mensajes sin leer."
              : "Aún no hay mensajes."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visibleMessages.map((message) => {
            const isUnread = message.read_at === null;
            const subject = encodeURIComponent(
              "Re: Tu mensaje a Con el pie derecho radio",
            );

            return (
              <li
                key={message.id}
                className={`rounded-2xl border p-5 ${
                  isUnread
                    ? "border-brand-400/40 bg-ink-900"
                    : "border-ink-800 bg-ink-900/60"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-white">
                      {message.name}
                      {isUnread && (
                        <span className="rounded-full bg-brand-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-300">
                          Nuevo
                        </span>
                      )}
                    </p>
                    <a
                      href={`mailto:${message.email}?subject=${subject}`}
                      className="break-all text-sm text-brand-400 hover:text-brand-300"
                    >
                      {message.email}
                    </a>
                  </div>
                  <time
                    dateTime={message.created_at}
                    className="text-xs text-ink-500"
                  >
                    {dateFormatter.format(new Date(message.created_at))}
                  </time>
                </div>

                {/* Se muestra como texto plano (React lo escapa): nunca se interpreta como HTML */}
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-ink-200">
                  {message.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-800 pt-3">
                  {/* Abre el programa de correo del admin con el destinatario ya puesto */}
                  <a
                    href={`mailto:${message.email}?subject=${subject}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    <Reply className="h-3.5 w-3.5" aria-hidden="true" />
                    Responder
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busyId === message.id}
                    onClick={() => handleToggleRead(message)}
                  >
                    {isUnread ? (
                      <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isUnread ? "Marcar como leído" : "Marcar como no leído"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busyId === message.id}
                    onClick={() => handleDelete(message)}
                    className="ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Borrar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
