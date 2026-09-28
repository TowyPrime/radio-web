"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Users } from "lucide-react";
import { type DemoChatMessage } from "@/data/demo";
import { useVisitor } from "@/context/VisitorContext";
import { createClient } from "@/utils/supabase/client";
import { notify } from "./toast";

interface ChatPanelProps {
  className?: string;
}

export default function ChatPanel({ className = "" }: ChatPanelProps) {
  const [messages, setMessages] = useState<DemoChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const { requireVisitor, visitorUid, username } = useVisitor();

  useEffect(() => {
    const supabase = createClient();

    const loadMessages = async () => {
      const { data: messagesList, error: errorMessages } = await supabase
        .from("messages")
        .select("id, message, created_at, visitor_uid")
        .order("created_at", { ascending: true });

      if (errorMessages) {
        console.log("Error al obtener mensajes: ", errorMessages);
        return;
      }

      const visitorUids = [
        ...new Set(messagesList?.map((msg) => msg.visitor_uid) || []),
      ];

      if (visitorUids.length === 0) return;

      const { data: visitorProfiles, error: errorProfiles } = await supabase
        .from("visitor_profiles")
        .select("uid, username")
        .in("uid", visitorUids);

      if (errorProfiles) {
        console.error("Error al obtener perfiles: ", errorProfiles);
        return;
      }

      const usernameMap = new Map(
        visitorProfiles?.map((profile) => [profile.uid, profile.username]) ||
          [],
      );

      const loadedMessages: DemoChatMessage[] = messagesList.map((row) => {
        const authorName = usernameMap.get(row.visitor_uid) ?? "visitante";

        const formattedTime = new Date(row.created_at).toLocaleTimeString(
          "es-ES",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );

        return {
          id: row.id,
          author: authorName,
          text: row.message,
          time: formattedTime,
          mine: row.visitor_uid === visitorUid,
        };
      });

      setMessages(loadedMessages);
    };

    loadMessages();
const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            message: string;
            created_at: string;
            visitor_uid: string;
          };

          const isMine = newMessage.visitor_uid === visitorUid;

          const authorName = isMine ? (username || "visitante") : "visitante";

          const formattedTime = new Date(
            newMessage.created_at,
          ).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });

          const messageItem: DemoChatMessage = {
            id: newMessage.id,
            author: authorName,
            text: newMessage.message,
            time: formattedTime,
            mine: isMine,
          };

          // Actualizamos el estado evitando duplicados con .some()
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, messageItem];
          });

          // Si el mensaje es de otra persona, consultamos su perfil de forma puntual
          if (!isMine) {
            const { data: profile } = await supabase
              .from("visitor_profiles")
              .select("username")
              .eq("uid", newMessage.visitor_uid)
              .single();

            if (profile?.username) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newMessage.id ? { ...m, author: profile.username } : m
                )
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [username, visitorUid]);

  // Desplaza solo la caja del chat (scrollIntoView movería también toda la página)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    try {
      const listo = await requireVisitor();

      if (!listo) return;

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo agregar el mensaje");
      }

      const rawMessage = data.chatMessage;

      const formattedDate = new Date(rawMessage.created_at).toLocaleTimeString(
        "es-Es",
        { hour: "2-digit", minute: "2-digit" },
      );

      const newMessageItem = {
        id: rawMessage.id,
        author: rawMessage.username || "visitante",
        text: rawMessage.message,
        time: formattedDate,
        mine: true,
      };

      setMessages((prevMessages) => [newMessageItem, ...prevMessages]);

      setDraft("");
    } catch (err: unknown) {
      console.error("Error al enviar mensaje:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar tu mensaje. Inténtalo de nuevo.";
      notify.error(errorMessage);
    }
  };

  return (
    <section
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${className}`}
    >
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <h2 className="font-semibold text-white">Chat en vivo</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-4 h-4" />
          124 oyentes
        </span>
      </header>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
          >
            <div className="flex items-baseline gap-2 mb-0.5">
              <span
                className={`text-xs font-semibold ${m.role === "locutor" ? "text-red-400" : "text-blue-400"}`}
              >
                {m.author}
              </span>
              {m.role === "locutor" && (
                <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] uppercase font-bold px-1.5 py-px rounded-full">
                  Locutor
                </span>
              )}
              <span className="text-[10px] text-slate-500">{m.time}</span>
            </div>
            <p
              className={`text-sm px-3.5 py-2 rounded-2xl max-w-[85%] ${
                m.mine
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-200"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={send}
        className="flex gap-2 p-3 border-t border-slate-800"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full transition-colors cursor-pointer"
          aria-label="Enviar mensaje"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}
