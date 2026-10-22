import type { Metadata } from "next";
import type { IconType } from "react-icons";
import { SiFacebook, SiSpotify, SiYoutube } from "react-icons/si";
import ContactForm from "@/components/ContactForm";
import { SOCIAL_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos o síguenos en nuestras redes.",
};

const SOCIAL_ICONS: Record<(typeof SOCIAL_LINKS)[number]["id"], IconType> = {
  facebook: SiFacebook,
  spotify: SiSpotify,
  youtube: SiYoutube,
};

export default function ContactPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Contacto</h1>
      <p className="text-ink-400 text-sm mb-8">
        ¿Tienes una sugerencia, una noticia o quieres pedir una canción?
        Escríbenos.
      </p>

      <div className="grid gap-6 md:grid-cols-5">
        <ContactForm />

        <aside className="md:col-span-2 bg-ink-900 border border-ink-800 rounded-2xl p-6 space-y-4 h-fit">
          <h2 className="font-semibold text-white">Encuéntranos en</h2>

          <ul className="space-y-3">
            {SOCIAL_LINKS.map((social) => {
              const Icon = SOCIAL_ICONS[social.id];

              return (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-xl border border-ink-800 bg-ink-950/40 p-3 transition-colors hover:border-brand-400/50 hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-ink-300 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-white">
                        {social.label}
                      </span>
                      <span className="block truncate text-xs text-ink-400">
                        {social.description}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
}
