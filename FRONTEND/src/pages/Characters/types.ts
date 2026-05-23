import type React from 'react';

export const STATS = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'] as const;
export type StatKey = typeof STATS[number];
export type EntryTipo = 'ataque' | 'conjuro';

export interface Stats {
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
}

export interface AttackSpellEntry {
  id: string;
  nombre: string;
  bonificador: string;
  dano: string;
  tipo: EntryTipo;
  rangoCasillas?: number;
}

export interface PersonajeResponseDTO {
  id: number;
  nombre: string;
  clase: string;
  raza: string;
  nivel: number;
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
  puntosGolpeMax?: number;
  claseArmadura?: number;
  iniciativa?: number;
  velocidad?: number;
  bonificacionCompetencia?: number;
  avatar?: string | null;
  alineamiento?: string | null;
}

export type DragPayload =
  | { source: 'pool-puntos'; valor: number }
  | { source: 'pool-dados';  id: number }
  | { source: 'stat-puntos'; stat: StatKey }
  | { source: 'stat-dados';  stat: StatKey };

export interface StatAssignmentResult {
  statsEstandar: Record<StatKey, number | null>;
  tiradas: { id: number; valor: number }[];
  tiradaAsignada: Record<StatKey, number | null>;
  statsFinal: Record<StatKey, number>;
  statsBase: Record<StatKey, number>;
  dragOverStat: StatKey | null;
  dragPayload: React.MutableRefObject<DragPayload | null>;
  idsUsados: number[];
  isRolling: boolean;
  d20Dado: string | null;
  d20Resultado: number | null;
  setDragOverStat: (stat: StatKey | null) => void;
  valoresUsados: (stat: StatKey) => number[];
  asignarPuntoEstandar: (stat: StatKey, valor: number | null) => void;
  asignarTirada: (stat: StatKey, id: number | null) => void;
  handleDropOnStat: (target: StatKey) => void;
  reiniciarTiradas: () => void;
  rollNextD20: () => void;
  handleD20AnimacionFin: (result: number) => void;
  resetAll: () => void;
}

export interface AttackEntriesResult {
  attackSpellEntries: AttackSpellEntry[];
  entryTipo: EntryTipo;
  entryNombre: string;
  entryBonificador: string;
  entryDano: string;
  entryRango: number;
  setEntryTipo: (v: EntryTipo) => void;
  setEntryNombre: (v: string) => void;
  setEntryBonificador: (v: string) => void;
  setEntryDano: (v: string) => void;
  setEntryRango: (v: number) => void;
  addEntry: () => void;
  removeEntry: (id: string) => void;
}
