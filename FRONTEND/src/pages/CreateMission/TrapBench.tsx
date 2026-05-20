import { useState } from 'react';
import './TrapBench.css';

export interface TrapType {
  id: string;
  nombre: string;
  imageUrl: string;
  cantidad: number;
}

export const TRAP_TYPES: TrapType[] = [
  { id: 'bomba',   nombre: 'Bomba',              imageUrl: '/images/trampas/bombatrampa.jpg',  cantidad: 3  },
  { id: 'cepo',    nombre: 'Cepo',               imageUrl: '/images/trampas/cepotrampa.jpg',   cantidad: 5  },
  { id: 'bloqueo', nombre: 'Casilla de Bloqueo', imageUrl: '/images/trampas/iconoBloqueo.jpg', cantidad: 10 },
];

interface PlacedTrapRef {
  trapId: string;
}

interface TrapBenchProps {
  placedTraps: PlacedTrapRef[];
  onDragStart: (e: React.PointerEvent, trap: TrapType) => void;
  onRandomPlace: () => void;
  onAceptar?: () => void;
}

function TrapTokenImage({ imageUrl, nombre }: { imageUrl: string; nombre: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return <span className="trap-token-initials">{nombre.slice(0, 2).toUpperCase()}</span>;
  }

  return (
    <img
      src={imageUrl}
      alt={nombre}
      className="trap-token-img"
      onError={() => setError(true)}
    />
  );
}

export function TrapBench({ placedTraps, onDragStart, onRandomPlace, onAceptar }: TrapBenchProps) {
  const getPlacedCount = (trapId: string) => placedTraps.filter(p => p.trapId === trapId).length;
  const allPlaced = TRAP_TYPES.every(t => getPlacedCount(t.id) >= t.cantidad);

  return (
    <aside className="trap-bench">
      <div className="trap-bench-header">
        <h2 className="trap-bench-title">Configuración del mapa</h2>
        <p className="trap-bench-subtitle">Prepara el tablero para la aventura de los personajes</p>
      </div>

      <div className="trap-bench-list">
        <div className="trap-bench-section">
          <h3 className="trap-bench-section-title">Trampas</h3>
          <p className="trap-bench-section-subtitle">Arrastra al tablero para colocarlas</p>
        </div>

        {TRAP_TYPES.map(trap => {
          const placedCount = getPlacedCount(trap.id);
          const remaining = trap.cantidad - placedCount;
          const exhausted = remaining <= 0;
          return (
            <div
              key={trap.id}
              className={`trap-card ${exhausted ? 'trap-card--exhausted' : ''}`}
              title={trap.nombre}
            >
              <div
                className="trap-token-drag"
                onPointerDown={exhausted ? undefined : (e) => onDragStart(e, trap)}
                style={{ cursor: exhausted ? 'not-allowed' : 'grab' }}
              >
                <div className="trap-token-circle">
                  <TrapTokenImage imageUrl={trap.imageUrl} nombre={trap.nombre} />
                  {!exhausted && <div className="trap-token-pulse" />}
                </div>
              </div>

              <div className="trap-card-info">
                <span className="trap-card-name">{trap.nombre}</span>
                <div className="trap-card-count">
                  <span className={`trap-count-badge ${exhausted ? 'exhausted' : ''}`}>
                    {placedCount}/{trap.cantidad}
                  </span>
                  <span className="trap-count-label">
                    {exhausted ? 'Todas colocadas' : `${remaining} disponibles`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="trap-bench-footer">
        <button
          type="button"
          className="trap-bench-random-btn"
          onClick={onRandomPlace}
        >
          🎲 Colocación aleatoria
        </button>
        <button type="button" className="trap-bench-next-btn" disabled={!allPlaced} onClick={allPlaced ? onAceptar : undefined}>
          {allPlaced ? 'Aceptar' : (
            <>
              Siguiente
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
