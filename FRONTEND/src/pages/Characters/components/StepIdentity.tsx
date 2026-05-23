import { RAZAS, CLASES, TRASFONDOS, STAT_LABELS, MAX_PALABRAS } from '../constants';
import { FileText } from 'pixelarticons/react';
import type { StatKey } from '../types';

interface StepIdentityProps {
  nombre: string;
  raza: string;
  clase: string;
  trasfondo: string;
  historia: string;
  palabras: number;
  setNombre: (v: string) => void;
  setRaza: (v: string) => void;
  setClase: (v: string) => void;
  setTrasfondo: (v: string) => void;
  handleHistoria: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  paso1Valido: boolean;
  onNext: () => void;
}

export function StepIdentity({
  nombre, raza, clase, trasfondo, historia, palabras,
  setNombre, setRaza, setClase, setTrasfondo, handleHistoria,
  paso1Valido, onNext,
}: StepIdentityProps) {
  const razaData = RAZAS.find(r => r.nombre === raza);
  const trasfondoData = TRASFONDOS.find(t => t.nombre === trasfondo);

  return (
    <div className="create-card">
      <h4 className="create-section-title mb-4">
        <FileText width={24} height={24} style={{ color: '#e2b96f' }} /> Identidad del Personaje
      </h4>
      <div className="row g-4">

        <div className="col-12">
          <label className="create-label">Nombre del personaje</label>
          <input type="text" className="form-control create-input"
            placeholder="¿Cómo se llama tu aventurero?" value={nombre}
            onChange={e => setNombre(e.target.value)} />
        </div>

        <div className="col-md-6">
          <label className="create-label">Especie / Raza</label>
          <select className="form-select create-input" value={raza} onChange={e => setRaza(e.target.value)}>
            <option value="">Selecciona una especie...</option>
            {RAZAS.map(r => <option key={r.nombre} value={r.nombre}>{r.nombre}</option>)}
          </select>
          {raza && razaData && (
            <div className="create-bonus-preview mt-2">
              {Object.entries(razaData.bonuses).map(([stat, val]) => (
                <span key={stat} className="create-bonus-tag">+{val} {STAT_LABELS[stat as StatKey]}</span>
              ))}
            </div>
          )}
        </div>

        <div className="col-md-6">
          <label className="create-label">Clase</label>
          <select className="form-select create-input" value={clase} onChange={e => setClase(e.target.value)}>
            <option value="">Selecciona una clase...</option>
            {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="col-12">
          <label className="create-label">Trasfondo</label>
          <select className="form-select create-input" value={trasfondo} onChange={e => setTrasfondo(e.target.value)}>
            <option value="">Selecciona un trasfondo...</option>
            {TRASFONDOS.map(t => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)}
          </select>
          {trasfondo && trasfondoData && (
            <div className="create-trasfondo-info mt-3">
              <p className="create-trasfondo-desc">{trasfondoData.descripcion}</p>
              <div className="d-flex gap-2 flex-wrap mt-2">
                <span className="create-trasfondo-label">Competencias:</span>
                {trasfondoData.competencias.map(c => <span key={c} className="create-bonus-tag">{c}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="col-12">
          <label className="create-label">
            Historia del personaje
            <span className="create-label-optional"> — opcional</span>
          </label>
          <textarea
            className="form-control create-input create-textarea"
            placeholder="Cuenta brevemente quién es tu personaje, de dónde viene y qué le mueve a aventurarse... (máx. 120 palabras)"
            value={historia}
            onChange={handleHistoria}
            rows={4}
          />
          <div className={`create-word-count ${palabras > MAX_PALABRAS * 0.9 ? 'warning' : ''}`}>
            {palabras} / {MAX_PALABRAS} palabras
          </div>
        </div>

      </div>
      <div className="d-flex justify-content-end mt-4">
        <button className="btn create-btn-primary" disabled={!paso1Valido} onClick={onNext}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}
