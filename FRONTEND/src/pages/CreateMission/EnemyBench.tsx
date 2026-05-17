import { useState } from 'react';
import type { ModoHistoriaEnemigoDTO } from '../../services/enemigoService';
import './EnemyBench.css';

interface PlacedEnemy {
  instanciaId: string;
  enemigoId: number;
}

interface EnemyBenchProps {
  enemigos: ModoHistoriaEnemigoDTO[];
  cargando: boolean;
  placedEnemies: PlacedEnemy[];
  onDragStart: (e: React.PointerEvent, enemigo: ModoHistoriaEnemigoDTO) => void;
  onSiguiente: () => void;
  onRandomPlace: () => void;
}

function getInitials(nombre: string) {
  return nombre.slice(0, 2).toUpperCase();
}

function getEnemigoImageKey(nombre: string): string {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
}

function EnemyTokenImage({ nombre }: { nombre: string }) {
  const [triedJpg, setTriedJpg] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="enemy-token-initials">{getInitials(nombre)}</span>;
  }

  const key = getEnemigoImageKey(nombre);
  const src = triedJpg
    ? `/images/enemigos/${key}Enemigo.jpg`
    : `/images/enemigos/${key}Enemigo.png`;

  return (
    <img
      src={src}
      alt={nombre}
      className="enemy-token-img"
      onError={() => {
        if (!triedJpg) setTriedJpg(true);
        else setFailed(true);
      }}
    />
  );
}

function getCrLabel(cr: number) {
  if (cr === 0) return '0';
  if (cr < 1) return `1/${Math.round(1 / cr)}`;
  return String(cr);
}

export function EnemyBench({ enemigos, cargando, placedEnemies, onDragStart, onSiguiente, onRandomPlace }: EnemyBenchProps) {
  const getPlacedCount = (enemigoId: number) =>
    placedEnemies.filter(p => p.enemigoId === enemigoId).length;

  const allPlaced = !cargando && enemigos.length > 0 &&
    enemigos.every(entry => getPlacedCount(entry.enemigo.id) >= entry.cantidad);

  return (
    <aside className="enemy-bench">
      <div className="enemy-bench-header">
        <h2 className="enemy-bench-title">Configuración del mapa</h2>
        <p className="enemy-bench-subtitle">Prepara el tablero para la aventura de los personajes</p>
      </div>

      <div className="enemy-bench-list">
        <div className="enemy-bench-section">
          <h3 className="enemy-bench-section-title">Enemigos</h3>
          <p className="enemy-bench-section-subtitle">Arrastra al tablero para colocarlos</p>
        </div>
        {cargando && (
          <div className="enemy-bench-loading">
            <div className="enemy-bench-spinner" />
            <span>Cargando...</span>
          </div>
        )}

        {!cargando && enemigos.length === 0 && (
          <div className="enemy-bench-empty">
            <span className="enemy-bench-empty-icon">☠</span>
            <p>No hay enemigos asignados a esta misión</p>
          </div>
        )}

        {!cargando && enemigos.map(entry => {
          const placed = getPlacedCount(entry.enemigo.id);
          const remaining = entry.cantidad - placed;
          const exhausted = remaining <= 0;

          return (
            <div
              key={entry.id}
              className={`enemy-card ${exhausted ? 'enemy-card--exhausted' : ''}`}
              title={`${entry.enemigo.nombre} — ${entry.enemigo.tipo}`}
            >
              <div
                className="enemy-token-drag"
                onPointerDown={exhausted ? undefined : (e) => onDragStart(e, entry)}
                style={{ cursor: exhausted ? 'not-allowed' : 'grab' }}
              >
                <div className="enemy-token-circle">
                  <EnemyTokenImage nombre={entry.enemigo.nombre} />
                  {!exhausted && <div className="enemy-token-pulse" />}
                </div>
              </div>

              <div className="enemy-card-info">
                <span className="enemy-card-name">{entry.enemigo.nombre}</span>
                <div className="enemy-card-stats">
                  <span className="enemy-stat enemy-stat--cr" title="Challenge Rating">
                    CR {getCrLabel(entry.enemigo.cr)}
                  </span>
                  <span className="enemy-stat enemy-stat--hp" title="Puntos de vida">
                    ♥ {entry.enemigo.salud}
                  </span>
                  <span className="enemy-stat enemy-stat--ca" title="Clase de armadura">
                    🛡 {entry.enemigo.ca}
                  </span>
                </div>
                <div className="enemy-card-count">
                  <span className={`enemy-count-badge ${exhausted ? 'exhausted' : ''}`}>
                    {placed}/{entry.cantidad}
                  </span>
                  <span className="enemy-count-label">
                    {exhausted ? 'Todos colocados' : `${remaining} disponibles`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="enemy-bench-footer">
        <button
          type="button"
          className="enemy-bench-random-btn"
          disabled={cargando || enemigos.length === 0}
          onClick={onRandomPlace}
        >
          🎲 Colocación aleatoria
        </button>
        <button type="button" className="enemy-bench-next-btn" disabled={!allPlaced} onClick={onSiguiente}>
          Siguiente
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
