// Ruta del inicio de sesión del equipo. No aparece en ningún enlace de la web: se entra
// escribiendo la dirección. Vive bajo /admin, que `proxy.ts` protege, así que allí se exceptúa
// esta ruta (si no, nadie podría llegar a iniciar sesión).
export const ADMIN_LOGIN_PATH = "/admin/acceder";
