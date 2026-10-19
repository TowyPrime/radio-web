@AGENTS.md

# Web-radio ("Con el pie derecho radio" / Onda Radio)

Portal de noticias y radio web con Next.js 16 (App Router) + React 19 + Supabase + Tailwind 4, desplegado en Vercel (el repositorio de GitHub `radio-web` está conectado: un push a `main` publica). Idioma del proyecto y de la conversación: **español**.

Estado y decisiones al **2026-10-16**. Este archivo no contiene secretos; las claves viven solo en `.env` (ignorado por Git).

## Forma de trabajo con el dueño del proyecto
- Es un estudiante: quiere aprender, pero se confunde si solo le doy pistas, y siente que no aprende si le doy el código completo. **Modo vigente (desde 2026-10-14): órdenes concretas y pasos numerados, sin el código completo.** Yo diseño; por cada tarea doy: objetivo en una línea, pasos numerados y concretos ("en el archivo X, debajo de Y, agrega Z"), el nombre exacto de las funciones/conceptos que debe usar, y qué probar. Si el tema **ya se vio**, lo remito al archivo donde lo hizo antes (ruta y función) como guía, sin pegar el código. Si el tema **es nuevo**, le muestro un **ejemplo resuelto de un problema parecido pero distinto** (con código) como guía visual, y él lo adapta al caso real. Él escribe el código, me lo pega, y yo reviso señalando errores con explicación breve del porqué. Si se atora de verdad, puedo dar un esqueleto con huecos. Historial de modos: socrático → "secuencia de pasos" → código completo → este.
- No editar sus archivos sin que lo pida. Si pide "colócalos tú", sí.
- **Verificar siempre en disco** lo que dice haber hecho (a veces no guarda el archivo o lo pone en otra ruta) y pedirle `npx tsc --noEmit`, `npx eslint .` y pruebas reales (con `fetch` desde la consola del navegador para las rutas de API).
- Las decisiones técnicas las propongo yo con una recomendación; al dueño solo le pregunto lo que depende del cliente.
- Sin emojis, respuestas claras. Cuando algo falle, pedirle el log de la terminal donde corre `npm run dev` (no se ve desde la sesión).

## Comandos
- `npm run dev` · `npx tsc --noEmit` · `npx eslint .` · `npm run build`
- Si `tsc` marca errores **solo dentro de `.next/`** (por páginas borradas), detén el servidor, borra `.next` y vuelve a arrancar.
- Variables de entorno (solo nombres): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (en producción debe ser el dominio real y configurarse **en el panel de Vercel**, no solo en `.env`; las variables no viajan con Git).
- En otra computadora: `git clone`, `npm install`, copiar `.env` a mano por un medio seguro, `git pull` antes de empezar y `commit`+`push` al terminar.

## Autenticación e identidad
- **Solo los administradores usan Supabase Auth.** No hay registro público ni Google. Las cuentas nuevas se crean únicamente con la página oculta `/admin/invite` (`inviteUserByEmail`, `redirectTo` = `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=/profile`); entran con `rol: 'user'`. Promover a `admin` se hace **a mano en Supabase** (puede haber varios admins). El invitado completa su perfil en `/profile` y pone contraseña con "Cambiar contraseña" (`ChangePasswordDialog`). Rutas de auth: `/auth/callback` (intercambio de `code`) y `/auth/confirm` (`token_hash`).
- **Los demás visitantes** eligen un nickname (sin cuenta): tabla `visitors`, cookie httpOnly `visitor_token` (guarda un token secreto, nunca el nombre), `VisitorContext` con `requireVisitor()` (promesa que se pausa hasta elegir nickname), `VisitorNicknameDialog`, `POST /api/visitor`. Al admin se le crea su fila de `visitors` automáticamente (`ensureAdminVisitor` en `utils/supabase/service.ts`, llamado desde `src/proxy.ts`), sin mostrarle el diálogo.
- `src/proxy.ts` (antes `middleware.ts`; así se llama en Next 16) refresca la sesión y protege los prefijos `/music`, `/playlist`, `/live/start` y `/admin` (solo `rol === 'admin'`; si no, redirige a `/`). **No protege `/api/admin/*`**: por eso **cada ruta de API de admin llama a `requireAdmin()`** (`src/utils/supabase/adminGuard.ts`, devuelve `{ok:true,user}` o `{ok:false,status,error}`: 401 sin sesión, 403 sin perfil/no admin, 500 error de BD).

## Clientes de Supabase (no mezclar)
- `utils/supabase/client.ts`: navegador (Client Components).
- `utils/supabase/server.ts`: servidor con la sesión por cookies (Server Components y Route Handlers). Usa `next/headers`: **nunca** en un Client Component.
- `utils/supabase/service.ts`: `createServiceRoleClient()` con la clave `service_role` (se salta RLS). Solo servidor. Un código que lo use no pregunta quién llama: verificar admin antes.

## Patrones de código que usamos en todas las rutas de API
- Handlers `(request, { params })` con `params: Promise<{ id: string }>` (se hace `await params`); la clave del objeto es el **nombre de la carpeta** (`[track_id]` → `track_id`).
- Orden: `requireAdmin()` → leer body (`try/catch` → 400) → comprobar que es objeto (`!body || typeof body !== 'object' || Array.isArray(body)`) → `typeof` de cada campo (nunca confiar en que sea string) → validaciones baratas → consultas → insertar. Un `catch` final con `console.error` y mensaje genérico (no filtrar `error.message` de Supabase al cliente).
- Códigos de Postgres: `23505` único → 409; `23503` FK → 404/400; `23514` check → 400; `23P01` exclusión (traslape) → 409; `PGRST116` (`.single()` sin filas) → 404. `.maybeSingle()` cuando "no existe" es normal. Borrar/actualizar con `.select().maybeSingle()` para saber si afectó una fila (404 si no).
- `supabase-js` **no lanza**: devuelve `{data, error}` (un `try/catch` alrededor no sirve). No hay transacciones de varias llamadas: usar una sola sentencia (`upsert`) o una función SQL.
- Relaciones incrustadas (`playlists(title)`, `tracks(...)`) llegan como **objeto** aunque TypeScript infiera arreglo: se verifica con un `console.log` real y se usa `as unknown as Interfaz`. Ese cast apaga el compilador: un typo (`playlist` vs `playlists`) solo se ve probando con datos reales.
- Mensajes que se pueden mostrar al usuario se lanzan como `AppError` (`src/data/AppError.ts`); el resto se registra y se muestra un texto genérico.
- Reglas idénticas en cliente y servidor; las constantes con la unidad en el nombre (`..._SECONDS`, `..._HOURS`); el servidor siempre tiene la última palabra y construye él mismo `path`/`url` de archivos (nunca confía en lo que mande el navegador).
- Cada tabla creada por SQL: **activar RLS y verificarlo** (`select relname, relrowsecurity from pg_class ...`), y probar un `insert` con la clave `anon` (debe fallar). Revisar `pg_constraint` por restricciones viejas olvidadas.
- Los `useEffect` no deben llamar `setState` de forma síncrona (regla `react-hooks/set-state-in-effect`): usar `setTimeout(fn, 0)` o eventos. No leer `ref.current` durante el render.

## Base de datos y almacenamiento (Supabase)
- Tablas: `profiles` (uid, username, full_name, avatar_url, rol), `visitors`, `messages` (chat; **Realtime** requiere activar la replicación de la tabla además de RLS; vista `visitor_profiles` para exponer solo uid+username), `tracks`, `playlists` (título único sin distinguir mayúsculas), `playlist_tracks` (`unique(playlist_id, track_id)` y `unique(playlist_id, position) deferrable initially deferred`), `schedule_slots` (`exclude using gist` sobre `tstzrange` para impedir traslapes), `news`.
- RLS: `tracks`, `messages` y `news` con lectura pública (`for select to public`); `playlists`, `playlist_tracks`, `schedule_slots`, `visitors`, `profiles`: cerradas (solo `service_role` desde la API). Toda escritura pasa por API con `service_role`.
- Buckets públicos: `images` (avatares, se sube desde el navegador), `tracks` (50 MB, `audio/mpeg, aac, wav, ogg`), `news-images` (5 MB, `jpeg, png, webp`).
- Subida de archivos con **URL firmada** (el archivo no pasa por Vercel por su límite de ~4.5 MB): ruta que valida admin y entrega `token` y `path` (el servidor decide `uploads/<uuid>.<ext>` o `covers/<uuid>.<ext>` desde una lista permitida) → el navegador usa `uploadToSignedUrl` → segunda llamada que registra la fila, comprueba con `storage.exists` y arma la `url` con `getPublicUrl`. Si el insert falla se borra el archivo huérfano (excepto en `23505`, porque pertenece a otra fila).

## Mapa del código (`src/`)
- `app/page.tsx`: página principal = **Noticias** (aún con `demoNews`) + botón flotante del chat. `app/chat`, `app/live`, `app/contact`, `app/login`, `app/profile`, `app/auth/*`.
- Admin (protegido por proxy): `app/admin/invite`, `app/music/save` (`MusicManager`: subir/listar/borrar canciones), `app/playlist/create` (`PlaylistManager`: crear/ver/editar/ordenar/renombrar/borrar playlists y agregar canciones), `app/live/start` (hoy solo simulación).
- API admin: `api/admin/{invite, tracks, tracks/upload-url, playlists, playlists/[id], playlists/[id]/tracks/[track_id], schedule, schedule/[id], news, news/[id], news/upload_url}`. Ojo: las canciones de una playlist (agregar `POST`, reordenar `PUT`, listar `GET`) están en `playlists/[id]/route.ts` (URL sin `/tracks`); `news/upload_url` lleva guion bajo a diferencia de `tracks/upload-url`.
- API pública: `api/schedule` (solo lectura, `service_role`, devuelve solo título/artista/duración/url), `api/messages` (chat), `api/visitor`, `api/account/delete`.
- `lib/tracks/{constants,functions}.ts` (tipos de archivo permitidos como `Map`, `UUID_REGEX`, límites, `getAudioDuration`, `convertSecondsInMinutes`), `lib/schedule/{constants,playback,server}.ts` (desfase UTC-6 fijo `-06:00`, `parseLocalDateTime`, `getPlaybackPosition`, `isPlaylistOnAir`/`isTrackOnAir`), `lib/news/{constants,sanitize,validate}.ts`.
- `services/audioService/` (`types.ts` con todos los tipos de pistas/playlists/emisión; `tracks.ts` con `getTracks` de servidor), `services/{authService,userService}.ts`, `context/{AudioContext,VisitorContext}.tsx`, `components/*`.

## Reproductor y programación (emisión de grabaciones)
- Se trabaja con **grabaciones**, no en vivo propio. El admin programa playlists en `schedule_slots` (horarios de **una sola vez**, ventana `starts_at`–`ends_at`; la playlist debe caber en la ventana; sin traslapes; zona horaria Ciudad de México UTC-6 sin horario de verano). Mientras una playlist está al aire, la API rechaza (409) editarla/borrarla y borrar sus canciones de la biblioteca (`lib/schedule/server.ts`).
- `GlobalPlayer` + `AudioContext` consultan `/api/schedule` al cargar y cada 60 s, calculan canción y segundo con la hora del servidor, avanzan pista a pista y al terminar quedan en "No hay transmisión en este momento" mostrando el próximo programa. `togglePlay` reproduce primero con datos en caché y refresca después (restricción de Safari/iOS). Los visitantes solo tienen play/pausa local.

## Noticias (TERMINADO y probado; cerrado 2026-10-16)
- **Hecho y probado (admin):** tabla `news` (título ≤120, resumen ≤300, categoría de la lista cerrada `NEWS_CATEGORIES` en `lib/news/constants.ts` —provisional, falta definirla con el cliente—, `body` HTML **sanitizado en el servidor** con `sanitize-html`, portada opcional, `author_name` del perfil del admin). API: crear, editar (`PUT`; `cover_path` `undefined`=conservar, `null`=quitar, texto=reemplazar), borrar (borra también la portada), subida firmada de portada (`api/admin/news/upload-url`, la API espera la clave `imageType`). Validación compartida en `lib/news/validate.ts` (`parseNewsInput`). Pantalla `/admin/news` (`NewsManager` + `NewsEditor` con TipTap v3 —`StarterKit` ya incluye link y underline—; estilos `.news-content` en `globals.css`; el editor se reinicia con `key`).
- **En curso (público):** `lib/news/queries.ts` (`getNews`, `getNewSummaries` sin `body`, `getNewsById`), tipo `newsSummary = Pick<NewsRecord, ...>` en `lib/news/types.ts`, `app/page.tsx` (lista real, ya escrita) y `app/news/[id]/page.tsx` (detalle, escrito pero con errores por corregir). **Correcciones pendientes en el detalle:** (1) importa `Link` de `next/link` (hoy lo toma de `lucide-react`, que es un ícono); (2) quitar los `notify.error(...)` (el toast es de cliente, no funciona en un Server Component); (3) `getNewsById` lanza error también cuando la noticia no existe: debe lanzar solo si hay `error` y devolver `null` si no hay fila, para que la página llame `notFound()`; (4) quitar clases `prose` (no hay plugin de tipografía). Luego probar: `/` con noticias reales, `/news/<id>`, uuid inválido o inexistente -> 404, y que un `<script>` guardado por API no se ejecute.
- **Pendiente:** definir categorías con el cliente; aviso de ESLint por `<img>` en lugar de `next/image` (opcional).

## Horarios (código listo; faltan pruebas manuales; actualizado 2026-10-19)
- Hecho: `/admin/schedule` (`components/ScheduleManager.tsx`: crear/listar/cancelar con `/api/admin/schedule`), `lib/schedule/{types,queries}.ts` (`getUpcomingSlots` con service_role) y `/live` leyendo horarios reales agrupados por día en hora de Ciudad de México (`export const dynamic = "force-dynamic"` va en `page.tsx`, no en `queries.ts`).
- Pendiente: pruebas (horario al aire / sin horarios / pasado / traslape / cancelar al aire); enlace "Programar horarios" en Navbar (confirmar); banner recordatorio semanal en `/admin/schedule`; opcional `router.refresh()` periódico en `/live`; limpiar `data/demo.ts` (solo `DemoChatMessage` se usa: moverlo a `lib/chat/types.ts` como `ChatMessage`).

## Pendiente / decisiones del cliente
- Se **eliminaron** historias, likes y comentarios (código y tablas). Se **queda** el chat en vivo y el sistema de visitantes con nickname.
- **En vivo con YouTube** (StreamYard → YouTube): `/live` mostrará el embed automático del directo del canal, `https://www.youtube.com/embed/live_stream?channel=<CHANNEL_ID>` (falta el `CHANNEL_ID`); decidir si `/live/start` y su enlace en el menú se quitan. Facebook queda fuera por ahora.
- Pantalla de administrador para **programar horarios** (crear/listar/cancelar con las rutas ya hechas) y un **recordatorio semanal** para que el admin revise los horarios (no se repiten solos).
- Buscar **almacenamiento alternativo** al bucket de Supabase por costo y límites (ideas: Cloudflare R2, Backblaze B2, Bunny Storage); programas largos exceden los límites actuales (20 min y 50 MB por archivo: `MAX_DURATION_SECONDS=1200`).
- Limpieza menor: `data/demo.ts` aún tiene datos de ejemplo usados por `/live` (`demoSchedule`) y la página principal (`demoNews`); renombrar `news/upload_url` a `upload-url` por consistencia (opcional).
