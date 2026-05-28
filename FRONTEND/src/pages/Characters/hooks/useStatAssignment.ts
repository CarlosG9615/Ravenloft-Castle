import { useState, useRef } from 'react';
import { STATS } from '../types';
import type { StatKey, DragPayload, StatAssignmentResult } from '../types';
import { RAZAS } from '../constants';
import { tirarD20CreacionPersonaje } from '../utils';

const EMPTY_STATS = (): Record<StatKey, number | null> =>
  ({ fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null });

interface UseStatAssignmentOptions {
  initialStatsEstandar?: Record<StatKey, number | null>;
  initialTiradas?: { id: number; valor: number }[];
  initialTiradaAsignada?: Record<StatKey, number | null>;
}

export function useStatAssignment(
  metodo: 'puntos' | 'dados',
  razaData: (typeof RAZAS)[number] | undefined,
  options: UseStatAssignmentOptions = {}
): StatAssignmentResult {
  const [statsEstandar, setStatsEstandar] = useState<Record<StatKey, number | null>>(
    options.initialStatsEstandar ?? EMPTY_STATS()
  );
  const [tiradas, setTiradas] = useState<{ id: number; valor: number }[]>(options.initialTiradas ?? []);
  const [tiradaAsignada, setTiradaAsignada] = useState<Record<StatKey, number | null>>(
    options.initialTiradaAsignada ?? EMPTY_STATS()
  );

  // Drag & drop
  const [dragOverStat, setDragOverStat] = useState<StatKey | null>(null);
  const dragPayload = useRef<DragPayload | null>(null);

  // Dice rolling
  const [d20Dado, setD20Dado] = useState<string | null>(null);
  const [d20Resultado, setD20Resultado] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const rollRegistradoRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MIN_D20_CREACION = 8;

  // Derived values
  const statsBase: Record<StatKey, number> = STATS.reduce((acc, stat) => {
    if (metodo === 'puntos') {
      acc[stat] = statsEstandar[stat] ?? 8;
    } else {
      const id = tiradaAsignada[stat];
      acc[stat] = id !== null ? (tiradas.find(t => t.id === id)?.valor ?? 8) : 8;
    }
    return acc;
  }, {} as Record<StatKey, number>);

  const statsFinal: Record<StatKey, number> = STATS.reduce((acc, stat) => {
    const bonus = (razaData?.bonuses as any)?.[stat] || 0;
    acc[stat] = statsBase[stat] + bonus;
    return acc;
  }, {} as Record<StatKey, number>);

  const idsUsados = Object.values(tiradaAsignada).filter(v => v !== null) as number[];

  const valoresUsados = (statActual: StatKey) =>
    STATS.filter(s => s !== statActual).map(s => statsEstandar[s]).filter(v => v !== null) as number[];

  // Handlers
  const asignarPuntoEstandar = (stat: StatKey, valor: number | null) =>
    setStatsEstandar(prev => ({ ...prev, [stat]: valor }));

  const asignarTirada = (stat: StatKey, idTirada: number | null) =>
    setTiradaAsignada(prev => ({ ...prev, [stat]: idTirada }));

  const handleDropOnStat = (targetStat: StatKey) => {
    const p = dragPayload.current;
    setDragOverStat(null);
    dragPayload.current = null;
    if (!p) return;

    if (p.source === 'pool-puntos') {
      const prevHolder = STATS.find(s => statsEstandar[s] === p.valor);
      if (prevHolder && prevHolder !== targetStat) {
        const displaced = statsEstandar[targetStat];
        setStatsEstandar(prev => ({ ...prev, [prevHolder]: displaced, [targetStat]: p.valor }));
      } else {
        asignarPuntoEstandar(targetStat, p.valor);
      }
    } else if (p.source === 'pool-dados') {
      const prevHolder = STATS.find(s => tiradaAsignada[s] === p.id);
      if (prevHolder && prevHolder !== targetStat) {
        const displaced = tiradaAsignada[targetStat];
        setTiradaAsignada(prev => ({ ...prev, [prevHolder]: displaced, [targetStat]: p.id }));
      } else {
        asignarTirada(targetStat, p.id);
      }
    } else if (p.source === 'stat-puntos' && p.stat !== targetStat) {
      const sourceVal = statsEstandar[p.stat];
      const targetVal = statsEstandar[targetStat];
      setStatsEstandar(prev => ({ ...prev, [p.stat]: targetVal, [targetStat]: sourceVal }));
    } else if (p.source === 'stat-dados' && p.stat !== targetStat) {
      const sourceId = tiradaAsignada[p.stat];
      const targetId = tiradaAsignada[targetStat];
      setTiradaAsignada(prev => ({ ...prev, [p.stat]: targetId, [targetStat]: sourceId }));
    }
  };

  const reiniciarTiradas = () => {
    setTiradas([]);
    setTiradaAsignada(EMPTY_STATS());
    setD20Dado(null);
    setD20Resultado(null);
    setIsRolling(false);
  };

  const resetAll = () => {
    setStatsEstandar(EMPTY_STATS());
    setTiradaAsignada(EMPTY_STATS());
    reiniciarTiradas();
  };

  const registrarTirada = (valor: number) => {
    if (rollRegistradoRef.current) return;
    rollRegistradoRef.current = true;
    const valorNormalizado = Math.max(MIN_D20_CREACION, valor);
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setTiradas(prev => [...prev, { id: prev.length, valor: valorNormalizado }]);
    setD20Dado(null);
    setD20Resultado(null);
    setIsRolling(false);
  };

  const rollNextD20 = () => {
    if (isRolling || tiradas.length >= 6) return;
    rollRegistradoRef.current = false;
    const result = tirarD20CreacionPersonaje();
    setIsRolling(true);
    setD20Resultado(result);
    setD20Dado('d20');
    const sound = new Audio('/public/sounds/diceroll/dado.wav');
    sound.play().catch(() => {});
    fallbackTimerRef.current = setTimeout(() => registrarTirada(result), 6000);
  };

  const handleD20AnimacionFin = (resultadoReal: number) => {
    registrarTirada(Math.max(MIN_D20_CREACION, resultadoReal));
  };

  return {
    statsEstandar, tiradas, tiradaAsignada,
    statsFinal, statsBase,
    dragOverStat, dragPayload,
    idsUsados, isRolling, d20Dado, d20Resultado,
    setDragOverStat, valoresUsados,
    asignarPuntoEstandar, asignarTirada, handleDropOnStat,
    reiniciarTiradas, rollNextD20, handleD20AnimacionFin, resetAll,
  };
}
