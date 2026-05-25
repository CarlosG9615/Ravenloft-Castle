import { STATS } from '../types';
import { PUNTOS_ESTANDAR, STAT_LABELS } from '../constants';
import type { StatKey, StatAssignmentResult, AttackEntriesResult } from '../types';
import { calcMod } from '../utils';
import { Clipboard } from 'pixelarticons/react';
import { Dices } from 'lucide-react';

interface StepStatsProps {
  metodo: 'puntos' | 'dados';
  onCambiarMetodo: (m: 'puntos' | 'dados') => void;
  statAssignment: StatAssignmentResult;
  attackEntries: AttackEntriesResult;
  razaData?: { bonuses: Partial<Record<StatKey, number>> };
  paso2Valido: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function StepStats({
  metodo, onCambiarMetodo, statAssignment, attackEntries, razaData, paso2Valido, onBack, onNext,
}: StepStatsProps) {
  const {
    statsEstandar, tiradas, tiradaAsignada, statsFinal, dragOverStat, dragPayload,
    idsUsados, isRolling, setDragOverStat,
    valoresUsados, asignarPuntoEstandar, asignarTirada, handleDropOnStat,
    reiniciarTiradas, rollNextD20,
  } = statAssignment;

  const {
    attackSpellEntries, entryTipo, entryNombre, entryBonificador, entryDano,
    setEntryTipo, setEntryNombre, setEntryBonificador, setEntryDano,
    addEntry, removeEntry,
  } = attackEntries;

  return (
    <div className="create-card">
      <h4 className="create-section-title mb-4">⚔ Características</h4>

      {/* Método */}
      <div className="mb-4">
        <label className="create-label mb-2">Método de asignación</label>
        <div className="d-flex gap-3">
          <button className={`btn create-method-btn ${metodo === 'puntos' ? 'active' : ''}`} onClick={() => onCambiarMetodo('puntos')}>
            <Clipboard width={20} height={20} style={{ color: 'currentColor' }} /> Asignación Estándar
          </button>
          <button className={`btn create-method-btn ${metodo === 'dados' ? 'active' : ''}`} onClick={() => onCambiarMetodo('dados')}>
            <Dices width={20} height={20} style={{ color: 'currentColor' }} /> Tirada de Dados
          </button>
        </div>
        <p className="create-method-desc mt-2">
          {metodo === 'puntos'
            ? 'Asigna los valores 15, 14, 13, 12, 10 y 8 a tus características. Cada valor solo puede usarse una vez.'
            : 'Tira 4d6 descartando el menor, repite 6 veces y asigna los resultados a tus características.'}
        </p>
      </div>

      {/* Puntos estándar */}
      {metodo === 'puntos' && (
        <>
          <div className="mb-3 d-flex gap-2 flex-wrap">
            {PUNTOS_ESTANDAR.map(p => {
              const used = Object.values(statsEstandar).includes(p);
              return (
                <span key={p} className={`create-tirada-tag ${used ? 'used' : ''}`}
                  draggable
                  onDragStart={() => { dragPayload.current = { source: 'pool-puntos', valor: p }; }}
                  onDragEnd={() => setDragOverStat(null)}
                >
                  {p}
                </span>
              );
            })}
            <small className="text-muted ms-2 align-self-center">
              {STATS.filter(s => statsEstandar[s] !== null).length}/6 asignados
            </small>
          </div>
          <div className="row g-3">
            {STATS.map(stat => (
              <div className="col-md-4" key={stat}>
                <div
                  className={`create-stat-box ${dragOverStat === stat ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverStat(stat); }}
                  onDragLeave={() => setDragOverStat(null)}
                  onDrop={() => handleDropOnStat(stat)}
                  draggable={statsEstandar[stat] !== null}
                  onDragStart={() => { if (statsEstandar[stat] !== null) dragPayload.current = { source: 'stat-puntos', stat }; }}
                  onDragEnd={() => setDragOverStat(null)}
                >
                  <span className="create-stat-label">{STAT_LABELS[stat]}</span>
                  <select className="form-select create-input text-center"
                    value={statsEstandar[stat] ?? ''}
                    onChange={e => asignarPuntoEstandar(stat, e.target.value === '' ? null : Number(e.target.value))}>
                    <option value="">— Elige —</option>
                    {PUNTOS_ESTANDAR.map(p => (
                      <option key={p} value={p} disabled={valoresUsados(stat).includes(p)}>
                        {p}{valoresUsados(stat).includes(p) ? ' (en uso)' : ''}
                      </option>
                    ))}
                  </select>
                  {razaData && (razaData.bonuses as any)[stat] && (
                    <span className="create-race-bonus">+{(razaData.bonuses as any)[stat]} raza</span>
                  )}
                  <span className="create-stat-final">
                    {statsEstandar[stat] !== null
                      ? <>{statsFinal[stat]} <small>{calcMod(statsFinal[stat])}</small></>
                      : <small className="text-muted">—</small>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tirada de dados */}
      {metodo === 'dados' && (
        <>
          <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
            <button className="btn create-btn-primary"
              onClick={tiradas.length >= 6 ? reiniciarTiradas : rollNextD20}
              disabled={isRolling}
            >
              <Dices width={20} height={20} style={{ color: 'currentColor' }} />
              {tiradas.length === 0 ? 'Tirar Dado' : tiradas.length >= 6 ? 'Reiniciar' : 'Volver a tirar'}
            </button>
            {tiradas.length > 0 && (
              <div className="d-flex gap-2 flex-wrap align-items-center">
                {tiradas.map(t => (
                  <span key={t.id}
                    className={`create-tirada-tag ${idsUsados.includes(t.id) ? 'used' : ''}`}
                    draggable
                    onDragStart={() => { dragPayload.current = { source: 'pool-dados', id: t.id }; }}
                    onDragEnd={() => setDragOverStat(null)}
                  >
                    {t.valor}
                  </span>
                ))}
                {tiradas.length < 6 && (
                  <span className="create-tirada-tag create-tirada-tag--pending">
                    {6 - tiradas.length} restante{6 - tiradas.length > 1 ? 's' : ''}
                  </span>
                )}
                <small className="text-muted ms-1 align-self-center">{idsUsados.length}/6 asignados</small>
              </div>
            )}
          </div>
          {tiradas.length > 0 && (
            <div className="row g-3">
              {STATS.map(stat => (
                <div className="col-md-4" key={stat}>
                  <div
                    className={`create-stat-box ${dragOverStat === stat ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOverStat(stat); }}
                    onDragLeave={() => setDragOverStat(null)}
                    onDrop={() => handleDropOnStat(stat)}
                    draggable={tiradaAsignada[stat] !== null}
                    onDragStart={() => { if (tiradaAsignada[stat] !== null) dragPayload.current = { source: 'stat-dados', stat }; }}
                    onDragEnd={() => setDragOverStat(null)}
                  >
                    <span className="create-stat-label">{STAT_LABELS[stat]}</span>
                    <select className="form-select create-input text-center"
                      value={tiradaAsignada[stat] ?? ''}
                      onChange={e => asignarTirada(stat, e.target.value === '' ? null : Number(e.target.value))}>
                      <option value="">— Elige —</option>
                      {tiradas.map(t => (
                        <option key={t.id} value={t.id} disabled={idsUsados.includes(t.id) && tiradaAsignada[stat] !== t.id}>
                          {t.valor}{idsUsados.includes(t.id) && tiradaAsignada[stat] !== t.id ? ' (en uso)' : ''}
                        </option>
                      ))}
                    </select>
                    {razaData && (razaData.bonuses as any)[stat] && (
                      <span className="create-race-bonus">+{(razaData.bonuses as any)[stat]} raza</span>
                    )}
                    <span className="create-stat-final">
                      {tiradaAsignada[stat] !== null
                        ? <>{statsFinal[stat]} <small>{calcMod(statsFinal[stat])}</small></>
                        : <small className="text-muted">—</small>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Ataques y Conjuros */}
      <div className="create-ataques-block mt-4">
        <h5 className="create-subsection-title">Ataques y Conjuros</h5>
        <p className="create-method-desc">Agrega lo que tu personaje sabe usar o lanzar.</p>
        <div className="row g-3 mt-2">
          <div className="col-md-3">
            <label className="create-label">Tipo</label>
            <select className="form-select create-input" value={entryTipo}
              onChange={e => setEntryTipo(e.target.value as typeof entryTipo)}>
              <option value="ataque">Ataque</option>
              <option value="conjuro">Conjuro</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="create-label">Nombre</label>
            <input type="text" className="form-control create-input" placeholder="Ej: Espada larga"
              value={entryNombre} onChange={e => setEntryNombre(e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="create-label">Bonificador</label>
            <input type="text" className="form-control create-input" placeholder="Ej: +5"
              value={entryBonificador} onChange={e => setEntryBonificador(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="create-label">Daño</label>
            <input type="text" className="form-control create-input" placeholder="Ej: 1d8 + Fue"
              value={entryDano} onChange={e => setEntryDano(e.target.value)} />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn create-btn-primary" onClick={addEntry}>Agregar</button>
        </div>
        <div className="create-ataques-table mt-3">
          <div className="create-ataques-row create-ataques-header">
            <span>Nombre</span><span>Bonif.</span><span>Daño</span><span></span>
          </div>
          {attackSpellEntries.length === 0
            ? [1, 2].map(i => (
                <div key={`empty-${i}`} className="create-ataques-row">
                  <span>—</span><span>—</span><span>—</span><span></span>
                </div>
              ))
            : attackSpellEntries.map(entry => (
                <div key={entry.id} className="create-ataques-row">
                  <span>{entry.tipo === 'conjuro' ? `Conjuro: ${entry.nombre}` : entry.nombre}</span>
                  <span>{entry.bonificador}</span>
                  <span>{entry.dano}</span>
                  <span>
                    <button type="button" className="create-ataques-delete"
                      onClick={() => removeEntry(entry.id)}
                      aria-label={`Eliminar ${entry.nombre}`}>✕</button>
                  </span>
                </div>
              ))}
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button className="btn create-btn-secondary" onClick={onBack}>← Atrás</button>
        <button className="btn create-btn-primary" disabled={!paso2Valido} onClick={onNext}>Siguiente →</button>
      </div>
    </div>
  );
}
