import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ModalAlert } from '../../../components/ModalAlert/ModalAlert';
import { API_URL, authHeaders } from '../../../services/api';
import { getAvatarUrl } from '../../../utils/imageUtils';
import type { EnemyTokenConfig } from '../hooks/useStoryModeSync';

interface ModoHistoria {
  nombre?: string | null;
}

interface MisionStoryMode {
  id?: string | number | null;
  nombre?: string | null;
  descripcion?: string | null;
  dificultad?: string | null;
  xpRecompensa?: number | null;
}

interface PersonajeStoryMode {
  avatar?: string | null;
  nombre?: string | null;
  nivel?: number | null;
}

interface Aliado {
  id?: string | number;
  personajeId?: string | number;
  nombre: string;
  nivel?: number | null;
  avatar?: string | null;
  color?: string;
  conectado?: boolean;
  clase?: string;
}

interface ParticipanteInfo {
  personajeId: number;
  nombrePersonaje: string;
  nombreUsuario: string;
  avatar?: string | null;
  nivel?: number | null;
  ordenUnion?: number;
}

interface Props {
  modoHistoria: ModoHistoria | null;
  mision: MisionStoryMode | null;
  personaje: PersonajeStoryMode | null;
  jugadoresSincronizados?: Aliado[];
  enemyTokens?: EnemyTokenConfig[];
  jugadorActual?: any;
  participantes?: ParticipanteInfo[];
  abierto: boolean;
  onToggle: () => void;
  esMaster?: boolean;
  onMasterAbort?: () => void;
  onAbandonarConfirmado?: (nombrePersonaje: string) => void;
  openEnemyInstanceId?: string | null;
  onCloseEnemyModal?: () => void;
  enemyHpMap?: Record<string, number>;
  onEnemyHpChange?: (instanciaId: string, hp: number) => void;
}

const ORDER_COLORS = ['#C0392B', '#2980B9', '#F39C12', '#27AE60'];
const ENEMIES_PER_PAGE = 5;

type EnemyStats = {
  movimiento: number;
  dadosAtaque: number;
  dadosDefensa: number;
};

const ENEMY_STATS: Record<string, EnemyStats> = {
  goblin: { movimiento: 7, dadosAtaque: 2, dadosDefensa: 1 },
  zombie: { movimiento: 5, dadosAtaque: 1, dadosDefensa: 2 },
};

const normalizeText = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const getEnemyStats = (nombre?: string | null): EnemyStats => {
  const normalized = normalizeText(nombre ?? '');
  if (normalized.includes('goblin')) return ENEMY_STATS.goblin;
  if (normalized.includes('zombie')) return ENEMY_STATS.zombie;
  return { movimiento: 0, dadosAtaque: 0, dadosDefensa: 0 };
};

const getEnemyImageSrc = (nombre?: string | null) => {
  const normalized = normalizeText(nombre ?? '').replace(/\s+/g, '');
  if (normalized.includes('goblin')) return '/images/enemigos/goblinEnemigo.png';
  if (normalized.includes('zombie')) return '/images/enemigos/zombieEnemigo.jpg';
  return `/images/enemigos/${normalized || 'enemigo'}Enemigo.png`;
};

const resolveAvatarUrl = (avatar: string | undefined | null): string => {
  if (!avatar) return '/images/avatars/default.png';
  if (/^https?:\/\//i.test(avatar) || /^data:/i.test(avatar) || avatar.startsWith('/')) return avatar;
  return getAvatarUrl(avatar);
};

export function PanelLateralStoryMode({
  modoHistoria,
  mision,
  personaje,
  jugadoresSincronizados = [],
  enemyTokens = [],
  jugadorActual = null,
  participantes = [],
  abierto,
  onToggle,
  esMaster = false,
  onMasterAbort,
  onAbandonarConfirmado,
  openEnemyInstanceId = null,
  onCloseEnemyModal,
  enemyHpMap = {},
  onEnemyHpChange,
}: Props) {
  const navigate = useNavigate();
  const [showAbandonarMisionModal, setShowAbandonarMisionModal] = useState(false);
  const [abandonandoMision, setAbandonandoMision] = useState(false);
  const [enemyPage, setEnemyPage] = useState(0);
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyTokenConfig | null>(null);
  const [enemyHp, setEnemyHp] = useState<Record<string, number>>({});

  const misionId = mision?.id ?? null;
  const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;

  const getColorByOrden = (ordenUnion?: number | null): string => {
    if (ordenUnion === null || ordenUnion === undefined || Number.isNaN(Number(ordenUnion))) {
      return ORDER_COLORS[0];
    }
    return ORDER_COLORS[Number(ordenUnion)] ?? ORDER_COLORS[0];
  };

  const getParticipanteByPersonajeId = (id: string | number | null | undefined): ParticipanteInfo | undefined => {
    if (id === null || id === undefined) return undefined;
    return participantes.find((p) => String(p.personajeId) === String(id));
  };

  const getOrdenFromParticipante = (participante?: ParticipanteInfo | undefined): number | null => {
    if (participante?.ordenUnion === null || participante?.ordenUnion === undefined) return null;
    return Number.isNaN(Number(participante.ordenUnion)) ? null : Number(participante.ordenUnion);
  };

  const participantesOrdenados = [...participantes]
    .filter((p) => p.personajeId !== null && p.personajeId !== undefined)
    .sort((a, b) => {
      const ordenA = getOrdenFromParticipante(a);
      const ordenB = getOrdenFromParticipante(b);

      if (ordenA === null && ordenB === null) return String(a.personajeId).localeCompare(String(b.personajeId));
      if (ordenA === null) return 1;
      if (ordenB === null) return -1;
      return ordenA - ordenB;
    });

  const aliadosAMostrar = participantesOrdenados.filter((participante) => {
    const miParticipante = getParticipanteByPersonajeId(jugadorActual?.personajeId ?? jugadorActual?.id ?? personajeId);
    if (!miParticipante) return true;
    return String(participante.personajeId) !== String(miParticipante.personajeId);
  });

  useEffect(() => {
    setEnemyPage((currentPage) => {
      const totalPages = Math.max(1, Math.ceil(enemyTokens.length / ENEMIES_PER_PAGE));
      return Math.min(currentPage, totalPages - 1);
    });
  }, [enemyTokens.length]);

  useEffect(() => {
    setEnemyHp((prev) => {
      const next: Record<string, number> = {};
      for (const enemy of enemyTokens) {
        next[enemy.instanciaId] = prev[enemy.instanciaId] ?? (enemy.salud ?? 0);
      }
      return next;
    });
  }, [enemyTokens]);

  useEffect(() => {
    if (!enemyHpMap || Object.keys(enemyHpMap).length === 0) return;
    setEnemyHp((prev) => ({ ...prev, ...enemyHpMap }));
  }, [enemyHpMap]);

  useEffect(() => {
    if (!openEnemyInstanceId) return;
    const enemy = enemyTokens.find((e) => e.instanciaId === openEnemyInstanceId);
    if (!enemy) return;
    // Ensure the page with the enemy is visible
    const index = enemyTokens.findIndex(e => e.instanciaId === openEnemyInstanceId);
    if (index >= 0) setEnemyPage(Math.floor(index / ENEMIES_PER_PAGE));
    setSelectedEnemy(enemy);
  }, [openEnemyInstanceId, enemyTokens]);

  const totalEnemyPages = Math.max(1, Math.ceil(enemyTokens.length / ENEMIES_PER_PAGE));
  const visibleEnemyTokens = useMemo(() => {
    const start = enemyPage * ENEMIES_PER_PAGE;
    return enemyTokens.slice(start, start + ENEMIES_PER_PAGE);
  }, [enemyPage, enemyTokens]);

  const changeEnemyHp = (instanciaId: string, delta: number) => {
    const enemy = enemyTokens.find((item) => item.instanciaId === instanciaId);
    if (!enemy) return;

    const maxHp = enemy.salud ?? 0;
    setEnemyHp((prev) => {
      const currentHp = prev[instanciaId] ?? maxHp;
      const nextHp = Math.max(0, Math.min(maxHp, currentHp + delta));
      onEnemyHpChange?.(instanciaId, nextHp);
      return { ...prev, [instanciaId]: nextHp };
    });
  };

  const closeEnemyModal = () => setSelectedEnemy(null);
  const closeEnemyModalAndNotify = () => {
    setSelectedEnemy(null);
    if (onCloseEnemyModal) onCloseEnemyModal();
  };

  const selectedEnemyStats = getEnemyStats(selectedEnemy?.nombre);
  const selectedEnemyHp = selectedEnemy ? (enemyHp[selectedEnemy.instanciaId] ?? selectedEnemy.salud ?? 0) : 0;

  const aliadoConectado = (participante: ParticipanteInfo): boolean => {
    const syncMatch = jugadoresSincronizados.find((jugador) => {
      const jugadorPersonajeId = jugador?.personajeId ?? jugador?.id;
      return jugadorPersonajeId !== null && jugadorPersonajeId !== undefined && String(jugadorPersonajeId) === String(participante.personajeId);
    });
    return syncMatch?.conectado !== false;
  };

  const abandonarMision = async () => {
    if (!misionId || !personajeId) return;

    setAbandonandoMision(true);
    setShowAbandonarMisionModal(false);

    try {
      const response = await fetch(
        `${API_URL}/api/misiones/${misionId}/participantes/by-personaje/${personajeId}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
        }
      );

      if (!response.ok && response.status !== 404) {
        return;
      }

      onAbandonarConfirmado?.(personaje?.nombre ?? jugadorActual?.nombre ?? 'Personaje');
      sessionStorage.removeItem('tsm_session');
      navigate(-1);
    } finally {
      setAbandonandoMision(false);
    }
  };

  const abandonarMisionMaster = async () => {
    if (!misionId) return;

    setAbandonandoMision(true);
    setShowAbandonarMisionModal(false);

    try {
      await fetch(`${API_URL}/api/misiones/${misionId}/participantes`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      // continuar aunque falle la limpieza REST
    } finally {
      setAbandonandoMision(false);
    }

    onMasterAbort?.();
    sessionStorage.removeItem('tsm_session');
    navigate('/join/story-mode', { replace: true });
  };

  return (
    <div className={`tb-panel ${abierto ? 'abierto' : ''}`}>
      <button className="tb-panel-toggle" onClick={onToggle}>
        <span className="tb-panel-toggle-glyph">{abierto ? '<' : '>'}</span>
      </button>

      <div className="tb-panel-contenido">
        <h3 className="tb-panel-titulo">⚔ Modo Historia</h3>
        {modoHistoria?.nombre && (
          <p className="tb-campana-nombre">{modoHistoria.nombre}</p>
        )}

        {mision && (
          <div className="tb-seccion">
            <span className="tb-seccion-label">Misión activa</span>
            <p className="tsm-info-nombre">{mision.nombre ?? `Misión ${mision.id ?? '-'}`}</p>
            {mision.descripcion && (
              <p className="tsm-info-desc">{mision.descripcion}</p>
            )}
            {mision.dificultad && (
              <p className="tsm-info-sub">Dificultad: {mision.dificultad}</p>
            )}
            {mision.xpRecompensa != null && (
              <p className="tsm-info-sub">XP: {mision.xpRecompensa}</p>
            )}
          </div>
        )}

        {esMaster ? (
          <div className="tb-seccion">
            <span className="tb-seccion-label">Tu rol</span>
            <div className="tsm-master-badge-row">
              <span className="tsm-master-badge">⚔ Master</span>
              <p className="tsm-info-sub tsm-master-hint">Diriges la partida. Los jugadores esperan tus decisiones.</p>
            </div>
          </div>
        ) : personaje && (() => {
          const miParticipante = getParticipanteByPersonajeId(jugadorActual?.personajeId ?? jugadorActual?.id ?? personajeId);
          const miColor = getColorByOrden(miParticipante?.ordenUnion);
          return (
            <div className="tb-seccion">
              <span className="tb-seccion-label">Tu personaje</span>
              <div className="tsm-personaje-row">
                <img
                  src={resolveAvatarUrl(personaje.avatar)}
                  alt={personaje.nombre ?? 'Personaje'}
                  className="tsm-personaje-avatar"
                  style={{ borderColor: miColor, boxShadow: `0 0 8px ${miColor}` }}
                />
                <div className="tsm-personaje-info">
                  <p className="tsm-info-nombre">{personaje.nombre}</p>
                  <p className="tsm-info-sub">Nivel {personaje.nivel ?? '-'}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {esMaster ? (
          <div className="tb-seccion">
            <span className="tb-seccion-label">Enemigos activos ({enemyTokens.length})</span>
            <div className="tsm-enemies-stack">
              {visibleEnemyTokens.length > 0 ? (
                visibleEnemyTokens.map((enemy) => {
                  const hpActual = enemyHp[enemy.instanciaId] ?? enemy.salud ?? 0;
                  const hpMax = enemy.salud ?? 0;
                  const hpPercent = hpMax > 0 ? Math.max(0, Math.min(100, (hpActual / hpMax) * 100)) : 0;

                  return (
                    <div key={enemy.instanciaId} className="tsm-enemy-row">
                      <button type="button" className="tsm-enemy-avatar-btn" onClick={() => setSelectedEnemy(enemy)}>
                        <img
                          src={getEnemyImageSrc(enemy.nombre)}
                          alt={enemy.nombre}
                          className="tsm-enemy-avatar"
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).src = '/images/icons/rolo_triste.png';
                          }}
                        />
                      </button>
                      <div className="tsm-enemy-info">
                        <div className="tsm-enemy-header">
                          <button type="button" className="tsm-enemy-name-btn" onClick={() => setSelectedEnemy(enemy)}>
                            {enemy.nombre}
                          </button>
                          <span className="tsm-enemy-hp-text">{hpActual}/{hpMax}</span>
                        </div>
                        <div className="tsm-enemy-hp-bar-track">
                          <div className="tsm-enemy-hp-bar-fill" style={{ width: `${hpPercent}%` }} />
                        </div>
                        <div className="tsm-enemy-controls">
                          <button type="button" className="tsm-enemy-btn" onClick={() => changeEnemyHp(enemy.instanciaId, -1)} disabled={hpActual <= 0}>−</button>
                          <span className="tsm-enemy-hp-caption">Vida</span>
                          <button type="button" className="tsm-enemy-btn" onClick={() => changeEnemyHp(enemy.instanciaId, 1)} disabled={hpActual >= hpMax}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="tsm-info-sub">Aún no hay enemigos activos.</p>
              )}
            </div>

            {totalEnemyPages > 1 && (
              <div className="tsm-enemies-pagination">
                <button
                  type="button"
                  className="tsm-enemies-pag-btn"
                  onClick={() => setEnemyPage((current) => Math.max(0, current - 1))}
                  disabled={enemyPage <= 0}
                  aria-label="Página anterior de enemigos"
                >
                  {'<'}
                </button>
                <span className="tsm-enemies-pag-label">{enemyPage + 1} / {totalEnemyPages}</span>
                <button
                  type="button"
                  className="tsm-enemies-pag-btn"
                  onClick={() => setEnemyPage((current) => Math.min(totalEnemyPages - 1, current + 1))}
                  disabled={enemyPage >= totalEnemyPages - 1}
                  aria-label="Página siguiente de enemigos"
                >
                  {'>'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="tb-seccion">
            <span className="tb-seccion-label">Aliados ({aliadosAMostrar.length})</span>
            <div className="tsm-aliados-stack">
              {aliadosAMostrar.length > 0 ? (
                aliadosAMostrar.map((participante) => {
                  const color = getColorByOrden(participante.ordenUnion);
                  const conectado = aliadoConectado(participante);

                  return (
                    <div key={participante.personajeId} className="tsm-personaje-row">
                      <img
                        src={resolveAvatarUrl(participante.avatar)}
                        alt={participante.nombrePersonaje}
                        className="tsm-personaje-avatar"
                        style={{ borderColor: color, boxShadow: `0 0 8px ${color}` }}
                      />
                      <div className="tsm-personaje-info">
                        <p className="tsm-info-nombre">
                          {participante.nombrePersonaje}
                          {!conectado && ' ⚪'}
                        </p>
                        <p className="tsm-info-sub">
                          {`${participante.nombreUsuario} - Nivel ${participante.nivel ?? '-'}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : null}
            </div>
          </div>
        )}

        <button
          type="button"
          className="tb-btn-abandonar"
          onClick={() => setShowAbandonarMisionModal(true)}
          disabled={abandonandoMision}
        >
          Abandonar misión
        </button>

        <button className="tb-btn-salir" onClick={() => navigate(-1)}>← Salir</button>
      </div>

      <ModalAlert
        isOpen={showAbandonarMisionModal}
        title={esMaster ? 'TERMINAR PARTIDA' : 'ABANDONAR MISIÓN'}
        message={
          esMaster
            ? `¿Seguro que quieres terminar la partida? Se eliminarán todos los participantes de "${mision?.nombre ?? `Misión ${mision?.id ?? '-'}`}" y los jugadores serán expulsados. Esta acción no se puede deshacer.`
            : `¿Estás seguro de que deseas abandonar esta misión? Tu personaje se desvinculará de ${mision?.nombre ?? `Misión ${mision?.id ?? '-'}`}.`
        }
        confirmText={esMaster ? 'Terminar partida' : 'Abandonar'}
        cancelText="Cancelar"
        onConfirm={esMaster ? abandonarMisionMaster : abandonarMision}
        onCancel={() => setShowAbandonarMisionModal(false)}
        showImage={true}
      />

      {selectedEnemy && typeof document !== 'undefined' && createPortal(
        <div className="tsm-enemy-modal-overlay" onClick={closeEnemyModalAndNotify}>
          <div className="tsm-enemy-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tsm-enemy-modal-portrait">
              <img
                src={getEnemyImageSrc(selectedEnemy.nombre)}
                alt={selectedEnemy.nombre}
                className="tsm-enemy-modal-avatar"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).src = '/images/icons/rolo_triste.png';
                }}
              />
            </div>
            <h3 className="tsm-enemy-modal-title">{selectedEnemy.nombre}</h3>
            <div className="tsm-enemy-modal-stats">
              <div className="tsm-enemy-modal-stat"><span>Movimiento</span><strong>{selectedEnemyStats.movimiento} casillas</strong></div>
              <div className="tsm-enemy-modal-stat"><span>Dados de ataque</span><strong>{selectedEnemyStats.dadosAtaque}</strong></div>
              <div className="tsm-enemy-modal-stat"><span>Dados de defensa</span><strong>{selectedEnemyStats.dadosDefensa}</strong></div>
            </div>
            <div className="tsm-enemy-modal-hp">
              <div className="tsm-enemy-hp-bar-track tsm-enemy-hp-bar-track--modal">
                <div
                  className="tsm-enemy-hp-bar-fill"
                  style={{ width: `${selectedEnemy.salud ? (selectedEnemyHp / selectedEnemy.salud) * 100 : 0}%` }}
                />
              </div>
              <span className="tsm-enemy-hp-text tsm-enemy-hp-text--modal">{selectedEnemyHp}/{selectedEnemy.salud ?? 0}</span>
            </div>
            <button type="button" className="tsm-enemy-modal-close" onClick={closeEnemyModalAndNotify}>Cerrar</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}