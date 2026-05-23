import type { StatKey } from './types';

export const RAZAS = [
  { nombre: 'Humano',    bonuses: { fuerza:1, destreza:1, constitucion:1, inteligencia:1, sabiduria:1, carisma:1 } },
  { nombre: 'Elfo',      bonuses: { destreza:2 } },
  { nombre: 'Enano',     bonuses: { constitucion:2 } },
  { nombre: 'Mediano',   bonuses: { destreza:2 } },
  { nombre: 'Semiorco',  bonuses: { fuerza:2, constitucion:1 } },
  { nombre: 'Gnomo',     bonuses: { inteligencia:2 } },
  { nombre: 'Semielfo',  bonuses: { carisma:2, destreza:1, sabiduria:1 } },
  { nombre: 'Dracónido', bonuses: { fuerza:2, carisma:1 } },
  { nombre: 'Tiefling',  bonuses: { inteligencia:1, carisma:2 } },
];

export const CLASES = [
  'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Explorador',
  'Guerrero', 'Hechicero', 'Mago', 'Monje', 'Paladín', 'Pícaro', 'Brujo',
];

export const GENEROS = ['Male', 'Female'] as const;

export const TRASFONDOS = [
  { nombre: 'Acólito',          descripcion: 'Has pasado tu vida al servicio de un templo.',              competencias: ['Perspicacia', 'Religión'] },
  { nombre: 'Artesano Gremial', descripcion: 'Eres miembro de un gremio artesanal.',                     competencias: ['Perspicacia', 'Persuasión'] },
  { nombre: 'Charlatán',        descripcion: 'Siempre has tenido don de gentes para engañar.',            competencias: ['Engañar', 'Juego de Manos'] },
  { nombre: 'Criminal',         descripcion: 'Eres un criminal con experiencia en el lado oscuro.',       competencias: ['Engañar', 'Sigilo'] },
  { nombre: 'Entretenido',      descripcion: 'Te has formado para actuar ante el público.',               competencias: ['Acrobacias', 'Interpretación'] },
  { nombre: 'Ermitaño',         descripcion: 'Viviste en reclusión, lejos de la sociedad.',               competencias: ['Medicina', 'Religión'] },
  { nombre: 'Forastero',        descripcion: 'Creciste en tierras salvajes, lejos de la civilización.',   competencias: ['Atletismo', 'Supervivencia'] },
  { nombre: 'Héroe Popular',    descripcion: 'Vienes de un humilde origen pero estás destinado a algo grande.', competencias: ['Trato con Animales', 'Supervivencia'] },
  { nombre: 'Noble',            descripcion: 'Entiendes la riqueza, el poder y los privilegios.',         competencias: ['Historia', 'Persuasión'] },
  { nombre: 'Marinero',         descripcion: 'Has navegado en un barco durante años.',                    competencias: ['Atletismo', 'Percepción'] },
  { nombre: 'Sabio',            descripcion: 'Pasaste años aprendiendo los secretos del mundo.',          competencias: ['Arcanos', 'Historia'] },
  { nombre: 'Soldado',          descripcion: 'Eres un veterano de guerra con experiencia en combate.',    competencias: ['Atletismo', 'Intimidar'] },
  { nombre: 'Urchin',           descripcion: 'Creciste en las calles de una gran ciudad.',                competencias: ['Juego de Manos', 'Sigilo'] },
];

export const TRASFONDOS_MAP = Object.fromEntries(
  TRASFONDOS.map(t => [t.nombre, { descripcion: t.descripcion, competencias: t.competencias }])
) as Record<string, { descripcion: string; competencias: string[] }>;

export const STAT_LABELS: Record<StatKey, string> = {
  fuerza: 'Fuerza', destreza: 'Destreza', constitucion: 'Constitución',
  inteligencia: 'Inteligencia', sabiduria: 'Sabiduría', carisma: 'Carisma',
};

export const PUNTOS_ESTANDAR = [15, 14, 13, 12, 10, 8];
export const MAX_PALABRAS = 120;

export const DADO_GOLPE_POR_CLASE: Record<string, number> = {
  'Bárbaro': 12,
  'Guerrero': 10, 'Paladín': 10, 'Explorador': 10,
  'Bardo': 8, 'Clérigo': 8, 'Druida': 8, 'Monje': 8, 'Pícaro': 8, 'Brujo': 8,
  'Hechicero': 6, 'Mago': 6,
};

export const HABILIDADES: { nombre: string; stat: StatKey }[] = [
  { nombre: 'Acrobacias',         stat: 'destreza' },
  { nombre: 'Arcanos',            stat: 'inteligencia' },
  { nombre: 'Atletismo',          stat: 'fuerza' },
  { nombre: 'Engañar',            stat: 'carisma' },
  { nombre: 'Historia',           stat: 'inteligencia' },
  { nombre: 'Intimidar',          stat: 'carisma' },
  { nombre: 'Juego de Manos',     stat: 'destreza' },
  { nombre: 'Medicina',           stat: 'sabiduria' },
  { nombre: 'Naturaleza',         stat: 'inteligencia' },
  { nombre: 'Percepción',         stat: 'sabiduria' },
  { nombre: 'Perspicacia',        stat: 'sabiduria' },
  { nombre: 'Persuasión',         stat: 'carisma' },
  { nombre: 'Religión',           stat: 'inteligencia' },
  { nombre: 'Sigilo',             stat: 'destreza' },
  { nombre: 'Supervivencia',      stat: 'sabiduria' },
  { nombre: 'Trato con Animales', stat: 'sabiduria' },
];

export const DEFAULT_STATS = {
  fuerza: 10, destreza: 10, constitucion: 10,
  inteligencia: 10, sabiduria: 10, carisma: 10,
};
