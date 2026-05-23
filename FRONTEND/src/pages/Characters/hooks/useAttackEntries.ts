import { useState, useEffect } from 'react';
import type { AttackSpellEntry, EntryTipo, AttackEntriesResult } from '../types';
import { createEntryId, defaultRango } from '../utils';

export function useAttackEntries(initial: AttackSpellEntry[] = []): AttackEntriesResult {
  const [attackSpellEntries, setAttackSpellEntries] = useState<AttackSpellEntry[]>(initial);
  const [entryTipo, setEntryTipo] = useState<EntryTipo>('ataque');
  const [entryNombre, setEntryNombre] = useState('');
  const [entryBonificador, setEntryBonificador] = useState('');
  const [entryDano, setEntryDano] = useState('');
  const [entryRango, setEntryRango] = useState<number>(defaultRango('ataque'));

  useEffect(() => {
    setEntryRango(defaultRango(entryTipo));
  }, [entryTipo]);

  const addEntry = () => {
    const nombreLimpio = entryNombre.trim();
    const bonifLimpio = entryBonificador.trim();
    const danoLimpio = entryDano.trim();
    if (!nombreLimpio || !bonifLimpio || !danoLimpio) return;

    const nuevo: AttackSpellEntry = {
      id: createEntryId(),
      nombre: nombreLimpio,
      bonificador: bonifLimpio,
      dano: danoLimpio,
      tipo: entryTipo,
      rangoCasillas: Number.isFinite(entryRango) ? entryRango : defaultRango(entryTipo),
    };

    setAttackSpellEntries(prev => [...prev, nuevo]);
    setEntryNombre('');
    setEntryBonificador('');
    setEntryDano('');
    setEntryRango(defaultRango(entryTipo));
  };

  const removeEntry = (id: string) =>
    setAttackSpellEntries(prev => prev.filter(item => item.id !== id));

  return {
    attackSpellEntries, entryTipo, entryNombre, entryBonificador, entryDano, entryRango,
    setEntryTipo, setEntryNombre, setEntryBonificador, setEntryDano, setEntryRango,
    addEntry, removeEntry,
  };
}
