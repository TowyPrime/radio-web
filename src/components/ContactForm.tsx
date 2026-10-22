"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { notify } from "@/components/toast";
import { AppError } from "@/data/AppError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_LIMITS,
} from "@/lib/contact/constants";
import { parseContactInput } from "@/lib/contact/validate";

const EMPTY_FORM = { name: "", email: "", message: "", [CONTACT_HONEYPOT_FIELD]: "" };

const LABEL_CLASSES =
  "mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400";

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSent, setWasSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // La misma validación que hace el servidor, para avisar antes de enviar
    const parsed = parseContactInput(form);
    if (!parsed.ok) {
      notify.error(parsed.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new AppError(
          data?.error || "No se pudo enviar el mensaje. Intenta de nuevo.",
        );
      }

      setForm(EMPTY_FORM);
      setWasSent(true);
    } catch (error: unknown) {
      if (!(error instanceof AppError)) {
        console.error("Error al enviar el mensaje de contacto:", error);
      }

      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al enviar tu mensaje. Inténtalo de nuevo más tarde.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (wasSent) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl border border-ink-800 bg-ink-900 p-8 text-center md:col-span-3"
      >
        <CheckCircle2 className="h-10 w-10 text-brand-400" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-white">
          ¡Gracias por escribirnos!
        </h2>
        <p className="max-w-sm text-sm text-ink-400">
          Recibimos tu mensaje. Te responderemos al correo que nos dejaste.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => setWasSent(false)}
        >
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-2xl border border-ink-800 bg-ink-900 p-6 md:col-span-3"
    >
      <div>
        <Label htmlFor="contact-name" className={LABEL_CLASSES}>
          Nombre
        </Label>
        <Input
          id="contact-name"
          required
          maxLength={CONTACT_LIMITS.nameMax}
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <Label htmlFor="contact-email" className={LABEL_CLASSES}>
          Correo electrónico
        </Label>
        <Input
          id="contact-email"
          required
          type="email"
          maxLength={CONTACT_LIMITS.emailMax}
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="tu@correo.com"
        />
      </div>

      <div>
        <Label htmlFor="contact-message" className={LABEL_CLASSES}>
          Mensaje
        </Label>
        <Textarea
          id="contact-message"
          required
          rows={5}
          maxLength={CONTACT_LIMITS.messageMax}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Escribe tu mensaje aquí..."
          className="resize-none"
        />
        <p className="mt-1 text-right text-xs text-ink-500">
          {form.message.length}/{CONTACT_LIMITS.messageMax}
        </p>
      </div>

      {/* Trampa para bots: las personas no lo ven ni lo rellenan */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="contact-website">No llenes este campo</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form[CONTACT_HONEYPOT_FIELD]}
          onChange={(e) =>
            setForm({ ...form, [CONTACT_HONEYPOT_FIELD]: e.target.value })
          }
        />
      </div>

      <Button type="submit" size="md" disabled={isSubmitting}>
        <Send className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Enviando..." : "Enviar mensaje"}
      </Button>

      <p className="text-xs text-ink-500">
        Usaremos tu correo solo para responderte.
      </p>
    </form>
  );
}
