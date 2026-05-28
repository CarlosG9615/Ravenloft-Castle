import { useState, useEffect } from 'react';
import type { AttackSpellEntry, EntryTipo, Stats } from '../types';
import { createEntryId, defaultRango, normalizeEntry, buildDefaultEntries } from '../utils';

export function useCharacterAttacks(
  modo: 'wizard' | 'view',
  entriesKey: string | null,
  claseFinal: string,
  statsFinales: Stats,
  bonifComp: number,
  entradasAtaquesConjuros?: AttackSpellEntry[]
) {
  const [attacks, setAttacks] = useState<AttackSpellEntry[]>([]);
  const [spells, setSpells] = useState<AttackSpellEntry[]>([]);
  const [entryTipo, setEntryTipo] = useState<EntryTipo>('ataque');
  const [entryNombre, setEntryNombre] = useState('');
  const [entryBonificador, setEntryBonificador] = useState('');
  const [entryDano, setEntryDano] = useState('');
  const [entryRango, setEntryRango] = useState<number>(defaultRango('ataque'));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryTipo, setEditingEntryTipo] = useState<EntryTipo | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [editingBonificador, setEditingBonificador] = useState('');
  const [editingDano, setEditingDano] = useState('');

  useEffect(() => {
    setEntryRango(defaultRango(entryTipo));
  }, [entryTipo]);

  useEffect(() => {
    if (modo !== 'wizard') return;
    const source = Array.isArray(entradasAtaquesConjuros) ? entradasAtaquesConjuros : [];
    const normalized = source.map(normalizeEntry);
    setAttacks(normalized.filter(e => e.tipo === 'ataque'));
    setSpells(normalized.filter(e => e.tipo === 'conjuro'));
  }, [modo, entradasAtaquesConjuros]);

  useEffect(() => {
    if (modo !== 'view' || !entriesKey) return;
    if (entradasAtaquesConjuros && entradasAtaquesConjuros.length > 0) return;

    const raw = localStorage.getItem(entriesKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AttackSpellEntry[];
        if (parsed.length > 0) {
          const normalized = parsed.map(normalizeEntry);
          setAttacks(normalized.filter(e => e.tipo === 'ataque'));
          setSpells(normalized.filter(e => e.tipo === 'conjuro'));
          return;
        }
      } catch { /* regenerate defaults */ }
    }

    const defaults = buildDefaultEntries(claseFinal, statsFinales, bonifComp);
    const normalized = defaults.map(normalizeEntry);
    setAttacks(normalized.filter(e => e.tipo === 'ataque'));
    setSpells(normalized.filter(e => e.tipo === 'conjuro'));
  }, [entriesKey, claseFinal, statsFinales, bonifComp, modo, entradasAtaquesConjuros]);

  useEffect(() => {
    if (modo !== 'view' || !entriesKey) return;
    localStorage.setItem(entriesKey, JSON.stringify([...attacks, ...spells]));
  }, [entriesKey, attacks, spells, modo]);

  const addEntry = () => {
    const nombreLimpio = entryNombre.trim();
    const bonifLimpio = entryBonificador.trim();
    const danoLimpio = entryDano.trim();
    if (!nombreLimpio || !bonifLimpio || !danoLimpio) return;

    const nuevo: AttackSpellEntry = {
      id: createEntryId(), nombre: nombreLimpio, bonificador: bonifLimpio, dano: danoLimpio,
      tipo: entryTipo,
      rangoCasillas: Number.isFinite(entryRango) ? entryRango : defaultRango(entryTipo),
    };

    if (entryTipo === 'ataque') setAttacks(prev => [...prev, nuevo]);
    else setSpells(prev => [...prev, nuevo]);

    setEntryNombre(''); setEntryBonificador(''); setEntryDano('');
    setEntryRango(defaultRango(entryTipo));
  };

  const removeEditedEntry = () => {
    if (!editingEntryId || !editingEntryTipo) return;
    if (editingEntryTipo === 'ataque') {
      setAttacks(prev => prev.filter(item => item.id !== editingEntryId));
    } else {
      setSpells(prev => prev.filter(item => item.id !== editingEntryId));
    }
    setEditingEntryId(null);
    setEditingEntryTipo(null);
  };

  const startEditEntry = (entry: AttackSpellEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntryTipo(entry.tipo);
    setEditingNombre(entry.nombre);
    setEditingBonificador(entry.bonificador);
    setEditingDano(entry.dano);
  };

  const saveEditEntry = () => {
    if (!editingEntryId || !editingEntryTipo) return;
    const nombreLimpio = editingNombre.trim();
    const bonifLimpio = editingBonificador.trim();
    const danoLimpio = editingDano.trim();

    if (!nombreLimpio && !bonifLimpio && !danoLimpio) { removeEditedEntry(); return; }
    if (!nombreLimpio || !bonifLimpio || !danoLimpio) return;

    const update = (prev: AttackSpellEntry[]) =>
      prev.map(item => item.id === editingEntryId
        ? { ...item, nombre: nombreLimpio, bonificador: bonifLimpio, dano: danoLimpio }
        : item
      );

    if (editingEntryTipo === 'ataque') setAttacks(update);
    else setSpells(update);

    setEditingEntryId(null);
    setEditingEntryTipo(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEditEntry(); return; }
    if (e.key === 'Escape') { setEditingEntryId(null); setEditingEntryTipo(null); }
  };

  return {
    attacks, spells,
    entryTipo, entryNombre, entryBonificador, entryDano, entryRango,
    setEntryTipo, setEntryNombre, setEntryBonificador, setEntryDano,
    editingEntryId, editingEntryTipo, editingNombre, editingBonificador, editingDano,
    setEditingNombre, setEditingBonificador, setEditingDano,
    addEntry, startEditEntry, saveEditEntry, handleEditKeyDown,
  };
}
