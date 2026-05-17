import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../../components/BackButton/BackButton';
import type { ModoHistoriaEnemigoDTO } from '../../services/enemigoService';
import { getEnemigosByModoHistoria } from '../../services/enemigoService';
import { buildMissionDetailsPath } from '../Mission/missionRoutes';
import { EnemyBench } from './EnemyBench';
import { TrapBench, TRAP_TYPES } from './TrapBench';
import type { TrapType } from './TrapBench';
import { MasterPrepBoard } from './MasterPrepBoard';
import type { MasterPrepBoardHandle, PlacedEnemy, PlacedTrap } from './MasterPrepBoard';
import { isSpawnCell } from './MasterPrepBoard';
import type { MapConfig } from '../TableroStoryMode/hooks/useBoardGrid';
import { API_URL, authHeaders } from '../../services/api';
import './CreateMission.css';

const BASE_MAP: Omit<MapConfig, 'imageUrl'> = {
  naturalWidth: 1401,
  naturalHeight: 1123,
  cellSize: 56,
  cols: 25,
  rows: 20,
  offsetX: -20,
  offsetY: -10,
};

const MAP_BY_DIFFICULTY: Record<string, MapConfig> = {
  facil:   { ...BASE_MAP, imageUrl: '/images/tableros/tableroModHistoria1.png' },
  fácil:   { ...BASE_MAP, imageUrl: '/images/tableros/tableroModHistoria1.png' },
  media:   { ...BASE_MAP, imageUrl: '/images/tableros/tableroModHistoria2.png' },
  medio:   { ...BASE_MAP, imageUrl: '/images/tableros/tableroModHistoria2.png' },
  dificil: { ...BASE_MAP, imageUrl: '/images/tableros/tableroModHistoria3.png' },
  difícil: { ...BASE_MAP, imageUrl: '/images/tableros/tableroModHistoria3.png' },
};

function resolveMapConfig(dificultad?: string): MapConfig {
  const key = (dificultad ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return MAP_BY_DIFFICULTY[key] ?? MAP_BY_DIFFICULTY['media'];
}

interface DraggingEnemy {
  entry: ModoHistoriaEnemigoDTO;
  ghostX: number;
  ghostY: number;
}

interface DraggingTrap {
  trap: TrapType;
  ghostX: number;
  ghostY: number;
}

type Step = 'enemies' | 'traps';

export function CreateMission() {
  const { id: modoHistoriaId, misionId } = useParams<{ id: string; misionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as { mision?: { dificultad?: string; nombre?: string }; modoHistoria?: unknown };

  const backPath = modoHistoriaId && misionId
    ? buildMissionDetailsPath(modoHistoriaId, misionId)
    : '/join/story-mode';

  const [step, setStep] = useState<Step>('enemies');
  const [enemigos, setEnemigos] = useState<ModoHistoriaEnemigoDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [placedEnemies, setPlacedEnemies] = useState<PlacedEnemy[]>([]);
  const [placedTraps, setPlacedTraps] = useState<PlacedTrap[]>([]);
  const [dragging, setDragging] = useState<DraggingEnemy | null>(null);
  const [draggingTrap, setDraggingTrap] = useState<DraggingTrap | null>(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const boardRef = useRef<MasterPrepBoardHandle>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  const mapConfig = resolveMapConfig(state.mision?.dificultad);

  useEffect(() => {
    if (!modoHistoriaId) return;
    getEnemigosByModoHistoria(modoHistoriaId)
      .then(setEnemigos)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [modoHistoriaId]);

  // ── DnD enemigos desde el bench ─────────────────────────────
  const handleDragStart = useCallback((e: React.PointerEvent, entry: ModoHistoriaEnemigoDTO) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({ entry, ghostX: e.clientX, ghostY: e.clientY });
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      setDragging(prev => prev ? { ...prev, ghostX: e.clientX, ghostY: e.clientY } : null);
    };

    const onUp = (e: PointerEvent) => {
      setDragging(prev => {
        if (!prev) return null;
        const result = boardRef.current?.tryDrop(e.clientX, e.clientY);
        if (result?.ok) {
          const { col, row } = result;
          setPlacedEnemies(current => {
            if (current.some(p => p.col === col && p.row === row)) return current;
            const placedCount = current.filter(p => p.enemigoId === prev.entry.enemigo.id).length;
            if (placedCount >= prev.entry.cantidad) return current;
            return [...current, {
              instanciaId: `${prev.entry.enemigo.id}-${Date.now()}`,
              enemigoId: prev.entry.enemigo.id,
              nombre: prev.entry.enemigo.nombre,
              col,
              row,
            }];
          });
        } else if (result?.reason === 'blocked') {
          setShowBlockedModal(true);
        }
        return null;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  // ── DnD trampas desde el bench ──────────────────────────────
  const handleTrapDragStart = useCallback((e: React.PointerEvent, trap: TrapType) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingTrap({ trap, ghostX: e.clientX, ghostY: e.clientY });
  }, []);

  useEffect(() => {
    if (!draggingTrap) return;

    const onMove = (e: PointerEvent) => {
      setDraggingTrap(prev => prev ? { ...prev, ghostX: e.clientX, ghostY: e.clientY } : null);
    };

    const onUp = (e: PointerEvent) => {
      setDraggingTrap(prev => {
        if (!prev) return null;
        const result = boardRef.current?.tryDrop(e.clientX, e.clientY);
        if (result?.ok) {
          const { col, row } = result;
          setPlacedTraps(current => {
            if (current.some(p => p.col === col && p.row === row)) return current;
            if (current.filter(p => p.trapId === prev.trap.id).length >= prev.trap.cantidad) return current;
            return [...current, {
              instanciaId: `${prev.trap.id}-${Date.now()}`,
              trapId: prev.trap.id,
              nombre: prev.trap.nombre,
              imageUrl: prev.trap.imageUrl,
              col,
              row,
            }];
          });
        } else if (result?.reason === 'blocked') {
          setShowBlockedModal(true);
        }
        return null;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingTrap]);

  const handleEnemyRemove = useCallback((instanciaId: string) => {
    setPlacedEnemies(prev => prev.filter(p => p.instanciaId !== instanciaId));
  }, []);

  const handleEnemyMove = useCallback((instanciaId: string, col: number, row: number) => {
    setPlacedEnemies(prev =>
      prev.map(p => p.instanciaId === instanciaId ? { ...p, col, row } : p)
    );
  }, []);

  const handleTrapRemove = useCallback((instanciaId: string) => {
    setPlacedTraps(prev => prev.filter(p => p.instanciaId !== instanciaId));
  }, []);

  const handleTrapMove = useCallback((instanciaId: string, col: number, row: number) => {
    setPlacedTraps(prev =>
      prev.map(p => p.instanciaId === instanciaId ? { ...p, col, row } : p)
    );
  }, []);

  const handleRandomPlace = useCallback(() => {
    const { cols, rows } = mapConfig;
    const validCells: { col: number; row: number }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!isSpawnCell(col, row)) validCells.push({ col, row });
      }
    }
    // Fisher-Yates shuffle
    for (let i = validCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validCells[i], validCells[j]] = [validCells[j], validCells[i]];
    }
    let idx = 0;
    const placed: PlacedEnemy[] = [];
    for (const entry of enemigos) {
      for (let i = 0; i < entry.cantidad; i++) {
        if (idx >= validCells.length) break;
        const { col, row } = validCells[idx++];
        placed.push({
          instanciaId: `${entry.enemigo.id}-rnd-${Date.now()}-${i}`,
          enemigoId: entry.enemigo.id,
          nombre: entry.enemigo.nombre,
          col,
          row,
        });
      }
    }
    setPlacedEnemies(placed);
  }, [enemigos, mapConfig]);

  const handleTrapRandomPlace = useCallback(() => {
    const { cols, rows } = mapConfig;
    const occupiedByEnemies = new Set(placedEnemies.map(p => `${p.col},${p.row}`));
    const validCells: { col: number; row: number }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!isSpawnCell(col, row) && !occupiedByEnemies.has(`${col},${row}`)) {
          validCells.push({ col, row });
        }
      }
    }
    for (let i = validCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validCells[i], validCells[j]] = [validCells[j], validCells[i]];
    }
    let idx = 0;
    const placed: PlacedTrap[] = [];
    for (const trap of TRAP_TYPES) {
      for (let i = 0; i < trap.cantidad; i++) {
        if (idx >= validCells.length) break;
        const { col, row } = validCells[idx++];
        placed.push({
          instanciaId: `${trap.id}-rnd-${Date.now()}-${i}`,
          trapId: trap.id,
          nombre: trap.nombre,
          imageUrl: trap.imageUrl,
          col,
          row,
        });
      }
    }
    setPlacedTraps(placed);
  }, [mapConfig, placedEnemies]);

  const handleClearBoard = () => {
    setPlacedEnemies([]);
    setPlacedTraps([]);
  };

  const handleAceptar = useCallback(async () => {
    if (misionId) {
      try {
        await fetch(`${API_URL}/api/misiones/${misionId}/participantes`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ rol: 'MASTER' }),
        });
      } catch {
        // ignorar errores de red; el join de WS funciona independientemente
      }
    }

    navigate('/tablero-story-mode', {
      state: {
        rol: 'master',
        modoHistoria: state.modoHistoria,
        mision: { ...state.mision, id: misionId },
        configPartida: {
          misionId,
          enemigos: placedEnemies.map(p => ({
            instanciaId: p.instanciaId,
            enemigoId: p.enemigoId,
            nombre: p.nombre,
            col: p.col,
            row: p.row,
          })),
          trampas: placedTraps.map(p => ({
            instanciaId: p.instanciaId,
            trapId: p.trapId,
            nombre: p.nombre,
            imageUrl: p.imageUrl,
            col: p.col,
            row: p.row,
          })),
        },
      },
    });
  }, [navigate, state, misionId, placedEnemies, placedTraps]);

  const isDraggingFromBench = !!(dragging || draggingTrap);
  const misionNombre = state.mision?.nombre ?? 'Preparar misión';

  return (
    <div className="create-mission-page">
      <div className="create-mission-topbar">
        <BackButton to={backPath} state={location.state} />
        <div className="create-mission-topbar-info">
          <span className="create-mission-topbar-label">Preparación de misión</span>
          <h1 className="create-mission-topbar-title">{misionNombre}</h1>
        </div>
        <div className="create-mission-topbar-actions">
          <button
            type="button"
            className="create-mission-btn create-mission-btn--secondary"
            onClick={handleClearBoard}
            disabled={placedEnemies.length === 0 && placedTraps.length === 0}
          >
            Limpiar tablero
          </button>
          <button
            type="button"
            className="create-mission-btn create-mission-btn--primary"
            disabled={placedEnemies.length === 0}
          >
            Iniciar partida
            {placedEnemies.length > 0 && (
              <span className="create-mission-btn-badge">{placedEnemies.length + placedTraps.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="create-mission-layout">
        {step === 'enemies' ? (
          <EnemyBench
            enemigos={enemigos}
            cargando={cargando}
            placedEnemies={placedEnemies}
            onDragStart={handleDragStart}
            onSiguiente={() => setStep('traps')}
            onRandomPlace={handleRandomPlace}
          />
        ) : (
          <TrapBench
            placedTraps={placedTraps}
            onDragStart={handleTrapDragStart}
            onRandomPlace={handleTrapRandomPlace}
            onAceptar={handleAceptar}
          />
        )}

        <MasterPrepBoard
          ref={boardRef}
          mapConfig={mapConfig}
          placedEnemies={placedEnemies}
          onEnemyRemove={handleEnemyRemove}
          onEnemyMove={handleEnemyMove}
          placedTraps={placedTraps}
          onTrapRemove={handleTrapRemove}
          onTrapMove={handleTrapMove}
          isDraggingFromBench={isDraggingFromBench}
        />
      </div>

      {/* Ghost enemigo */}
      {dragging && (
        <div
          ref={ghostRef}
          className="create-mission-ghost"
          style={{ left: dragging.ghostX, top: dragging.ghostY }}
        >
          <div className="enemy-token-circle">
            <span className="enemy-token-initials">
              {dragging.entry.enemigo.nombre.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Ghost trampa */}
      {draggingTrap && (
        <div
          className="create-mission-ghost"
          style={{ left: draggingTrap.ghostX, top: draggingTrap.ghostY }}
        >
          <div className="trap-token-circle">
            <img
              src={draggingTrap.trap.imageUrl}
              alt={draggingTrap.trap.nombre}
              className="trap-token-img"
            />
          </div>
        </div>
      )}

      {showBlockedModal && (
        <div className="cm-modal-overlay" onClick={() => setShowBlockedModal(false)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-icon">⚔</div>
            <h2 className="cm-modal-title">¡Error!</h2>
            <p className="cm-modal-body">Casilla no permitida</p>
            <p className="cm-modal-hint">Esta casilla está reservada para los personajes jugadores.</p>
            <button
              type="button"
              className="cm-modal-btn"
              onClick={() => setShowBlockedModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
