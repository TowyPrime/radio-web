// Datos de ejemplo para la muestra visual de la página (no dependen del backend).


export interface DemoNews {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  gradient: string;
}

export const demoNews: DemoNews[] = [
  {
    id: 'n1',
    title: 'Onda Radio estrena nueva programación de otoño',
    summary:
      'Tres programas nuevos, más música en vivo y una franja nocturna dedicada a los oyentes. Conoce todos los horarios de la temporada.',
    category: 'EMISORA',
    date: '20 de septiembre',
    author: 'Redacción',
    readTime: '3 min',
    gradient: 'from-blue-600 to-indigo-900',
  },
  {
    id: 'n2',
    title: 'Festival de jazz llenará la plaza central este fin de semana',
    summary: 'Más de quince bandas locales se presentarán con entrada libre. Transmitiremos en directo desde el escenario principal.',
    category: 'CULTURA',
    date: '19 de septiembre',
    author: 'Sofía Ramírez',
    readTime: '4 min',
    gradient: 'from-emerald-600 to-teal-900',
  },
  {
    id: 'n3',
    title: 'Entrevista: la voz detrás de las madrugadas',
    summary: 'Charlamos con nuestro locutor nocturno sobre veinte años frente al micrófono y las historias que nunca salieron al aire.',
    category: 'ENTREVISTA',
    date: '17 de septiembre',
    author: 'Carlos Méndez',
    readTime: '6 min',
    gradient: 'from-rose-600 to-purple-900',
  },
  {
    id: 'n4',
    title: 'Cómo sintonizarnos desde tu celular y tu computadora',
    summary: 'Guía rápida para escucharnos en cualquier dispositivo, activar las notificaciones y participar en el chat en vivo.',
    category: 'GUÍA',
    date: '15 de septiembre',
    author: 'Redacción',
    readTime: '2 min',
    gradient: 'from-amber-500 to-orange-900',
  },
  {
    id: 'n5',
    title: 'Resultados del concurso "Tu canción, tu historia"',
    summary: 'Recibimos más de 300 participaciones. Estas son las tres ganadoras que sonarán durante toda la semana.',
    category: 'CONCURSO',
    date: '12 de septiembre',
    author: 'Sofía Ramírez',
    readTime: '3 min',
    gradient: 'from-sky-500 to-blue-900',
  },
];

export interface DemoShow {
  time: string;
  name: string;
  host: string;
  live?: boolean;
}

export const demoSchedule: DemoShow[] = [
  { time: '06:00', name: 'Buenos días, ciudad', host: 'Carlos Méndez' },
  { time: '09:00', name: 'Café con noticias', host: 'Sofía Ramírez' },
  { time: '12:00', name: 'Hora del vinilo', host: 'Andrés Vega', live: true },
  { time: '15:00', name: 'Tarde de historias', host: 'Lucía Torres' },
  { time: '19:00', name: 'Top 20 de la semana', host: 'Andrés Vega' },
  { time: '22:00', name: 'Voces de la noche', host: 'Carlos Méndez' },
];

export interface DemoChatMessage {
  id: string;
  author: string;
  text: string;
  time: string;
  role?: 'locutor' | 'admin';
  mine?: boolean;
}


export interface DemoTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export const demoTracks: DemoTrack[] = [
  { id: 't1', title: 'Persiana Americana', artist: 'Soda Stereo', duration: '4:48' },
  { id: 't2', title: 'De Música Ligera', artist: 'Soda Stereo', duration: '3:32' },
  { id: 't3', title: 'Bailando', artist: 'Enrique Iglesias', duration: '4:03' },
  { id: 't4', title: 'Eres', artist: 'Café Tacvba', duration: '4:00' },
  { id: 't5', title: 'Ojalá', artist: 'Silvio Rodríguez', duration: '3:20' },
  { id: 't6', title: 'Color Esperanza', artist: 'Diego Torres', duration: '3:59' },
];

export const demoPlaylists = [
  { id: 'p1', name: 'Clásicos en español', tracks: 24 },
  { id: 'p2', name: 'Madrugada tranquila', tracks: 18 },
  { id: 'p3', name: 'Top 20 de la semana', tracks: 20 },
];
