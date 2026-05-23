import type { StatKey, Stats, AttackSpellEntry, EntryTipo } from './types';
import { DADO_GOLPE_POR_CLASE } from './constants';

export const calcularPuntosGolpeMax = (nombreClase: string, constitucion: number, nivel: number) => {
  const dadoGolpe = DADO_GOLPE_POR_CLASE[nombreClase] ?? 8;
  const nivelUno = dadoGolpe + constitucion;
  if (nivel <= 1) return nivelUno;
  return nivelUno + (nivel - 1) * (Math.floor(dadoGolpe / 2) + 1 + constitucion);
};

export const calcMod = (val: number) => {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

export const normalizarClase = (nombre: string) =>
  nombre.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const contarPalabras = (texto: string) =>
  texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;

export const createEntryId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatBonus = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export const defaultRango = (tipo: EntryTipo): number => (tipo === 'conjuro' ? 6 : 1);

export const normalizeEntry = (entry: AttackSpellEntry): AttackSpellEntry => ({
  ...entry,
  rangoCasillas: typeof entry.rangoCasillas === 'number' ? entry.rangoCasillas : defaultRango(entry.tipo),
});

export const isAbsoluteUrl = (v: string) => /^https?:\/\//i.test(v);
export const isDataUrl = (v: string) => /^data:/i.test(v);

export const tirarD20CreacionPersonaje = () => Math.max(8, Math.floor(Math.random() * 20) + 1);

export const buildDefaultEntries = (clase: string, stats: Stats, bonifComp: number): AttackSpellEntry[] => {
  const modFuerza   = Math.floor((stats.fuerza - 10) / 2);
  const modDestreza = Math.floor((stats.destreza - 10) / 2);
  const modInt      = Math.floor((stats.inteligencia - 10) / 2);
  const modSab      = Math.floor((stats.sabiduria - 10) / 2);
  const modCar      = Math.floor((stats.carisma - 10) / 2);

  const atq = (nombre: string, bonus: number, dano: string): AttackSpellEntry => ({
    id: createEntryId(), nombre, bonificador: formatBonus(bonus), dano,
    tipo: 'ataque', rangoCasillas: defaultRango('ataque'),
  });
  const cnj = (nombre: string, bonus: number, dano: string): AttackSpellEntry => ({
    id: createEntryId(), nombre, bonificador: formatBonus(bonus), dano,
    tipo: 'conjuro', rangoCasillas: defaultRango('conjuro'),
  });

  switch (clase) {
    case 'Bárbaro':  return [atq('Hacha grande',   modFuerza   + bonifComp, '1d12 + Fue')];
    case 'Guerrero': return [atq('Espada larga',   modFuerza   + bonifComp, '1d8 + Fue')];
    case 'Pícaro':   return [atq('Daga',           modDestreza + bonifComp, '1d4 + Des')];
    case 'Mago':     return [cnj('Rayo de fuego',  modInt      + bonifComp, '1d10 fuego')];
    case 'Clérigo':  return [cnj('Llama sagrada',  modSab      + bonifComp, '1d8 radiante')];
    case 'Bardo':    return [cnj('Burla viciosa',  modCar      + bonifComp, '1d4 psíquico')];
    default:         return [atq('Ataque básico',  modFuerza   + bonifComp, '1d6 + Fue')];
  }
};

export const normalizarTexto = (valor: string) =>
  valor.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const normalizarStatsBaseBackend = (statsBase: Record<StatKey, number>): Record<StatKey, number> => {
  const TARGET_TOTAL = 75;
  const MIN = 8;
  const MAX = 15;
  const STATS_LIST: StatKey[] = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'];

  const result: Record<StatKey, number> = {
    fuerza:       Math.min(MAX, Math.max(MIN, statsBase.fuerza)),
    destreza:     Math.min(MAX, Math.max(MIN, statsBase.destreza)),
    constitucion: Math.min(MAX, Math.max(MIN, statsBase.constitucion)),
    inteligencia: Math.min(MAX, Math.max(MIN, statsBase.inteligencia)),
    sabiduria:    Math.min(MAX, Math.max(MIN, statsBase.sabiduria)),
    carisma:      Math.min(MAX, Math.max(MIN, statsBase.carisma)),
  };

  let total = STATS_LIST.reduce((acc, s) => acc + result[s], 0);

  if (total < TARGET_TOTAL) {
    const asc = [...STATS_LIST].sort((a, b) => result[a] - result[b]);
    while (total < TARGET_TOTAL) {
      let changed = false;
      for (const s of asc) {
        if (result[s] < MAX && total < TARGET_TOTAL) { result[s]++; total++; changed = true; }
      }
      if (!changed) break;
    }
  }

  if (total > TARGET_TOTAL) {
    const desc = [...STATS_LIST].sort((a, b) => result[b] - result[a]);
    while (total > TARGET_TOTAL) {
      let changed = false;
      for (const s of desc) {
        if (result[s] > MIN && total > TARGET_TOTAL) { result[s]--; total--; changed = true; }
      }
      if (!changed) break;
    }
  }

  return result;
};
