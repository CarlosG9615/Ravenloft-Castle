import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModalAlert } from '../../components/ModalAlert/ModalAlert';
import { buildMissionDetailsPath } from '../Mission/missionRoutes';
import { PanelLateralStoryMode } from './components/PanelLateralStoryMode';
import { PanelPartidaStoryMode } from './components/PanelPartidaStoryMode';
import { TableroCentroStoryMode } from './components/TableroCentroStoryMode';
import type { BoardToken } from './components/GameBoard';
import { useStoryModeSync } from './hooks/useStoryModeSync';
import { API_URL, authHeaders } from '../../services/api';
import { getAvatarUrl } from '../../utils/imageUtils';
import './TableroStoryMode.css';
import './components/PanelPartidaStoryMode.css';

const SESSION_KEY = 'tsm_session';

type StoryRoom = {
  id: string;
  colStart: number;
  rowStart: number;
  colEnd: number;
  rowEnd: number;
};

const STORY_ROOMS: StoryRoom[] = [
  { id: 'sala1', colStart: 9, rowStart: 14, colEnd: 11, rowEnd: 18 },
  { id: 'sala2', colStart: 14, rowStart: 14, colEnd: 17, rowEnd: 18 },
  { id: 'sala3', colStart: 5, rowStart: 10, colEnd: 8, rowEnd: 18 },
  { id: 'sala4a', colStart: 18, rowStart: 15, colEnd: 19, rowEnd: 18 },
  { id: 'sala4b', colStart: 17, rowStart: 10, colEnd: 19, rowEnd: 14 },
  { id: 'sala5', colStart: 20, rowStart: 10, colEnd: 23, rowEnd: 13 },
  { id: 'sala6', colStart: 20, rowStart: 14, colEnd: 23, rowEnd: 18 },
  { id: 'sala7', colStart: 1, rowStart: 10, colEnd: 4, rowEnd: 18 },
  { id: 'sala8', colStart: 10, rowStart: 7, colEnd: 15, rowEnd: 12 },
  { id: 'sala9', colStart: 1, rowStart: 5, colEnd: 4, rowEnd: 8 },
  { id: 'sala10', colStart: 1, rowStart: 1, colEnd: 4, rowEnd: 4 },
  { id: 'sala11', colStart: 5, rowStart: 5, colEnd: 8, rowEnd: 8 },
  { id: 'sala12', colStart: 5, rowStart: 1, colEnd: 8, rowEnd: 4 },
  { id: 'sala13', colStart: 9, rowStart: 1, colEnd: 11, rowEnd: 5 },
  { id: 'sala14', colStart: 14, rowStart: 1, colEnd: 16, rowEnd: 5 },
  { id: 'sala15', colStart: 17, rowStart: 1, colEnd: 19, rowEnd: 4 },
  { id: 'sala16', colStart: 17, rowStart: 5, colEnd: 18, rowEnd: 8 },
  { id: 'sala17', colStart: 19, rowStart: 5, colEnd: 23, rowEnd: 8 },
  { id: 'sala18', colStart: 20, rowStart: 1, colEnd: 23, rowEnd: 4 },
];

const ORDER_COLORS = ['#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#E67E22', '#F39C12'];

type DefeatEvent = {
  type: 'player' | 'enemy';
  id: string;
  nombre: string;
  color?: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
};

const normalizeText = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const getEnemyImageSrc = (nombre?: string | null): string => {
  const normalized = normalizeText(nombre ?? '').replace(/\s+/g, '');
  if (normalized.includes('goblin')) return '/images/enemigos/goblinEnemigo.png';
  if (normalized.includes('zombie')) return '/images/enemigos/zombieEnemigo.jpg';
  return `/images/enemigos/${normalized || 'enemigo'}Enemigo.png`;
};

const resolveAvatarUrl = (avatar: string | undefined | null): string => {
  if (!avatar) return '/images/avatar-login.png';
  if (/^https?:\/\//i.test(avatar) || /^data:/i.test(avatar) || avatar.startsWith('/')) return avatar;
  return getAvatarUrl(avatar);
};

const colorForOrden = (orden: number | null | undefined): string => {
  if (orden == null || Number.isNaN(Number(orden))) return '#4a90d9';
  return ORDER_COLORS[Number(orden) % ORDER_COLORS.length];
};

function getRoomForCell(col: number, row: number): StoryRoom | null {
  return STORY_ROOMS.find((room) => (
    col >= room.colStart && col <= room.colEnd &&
    row >= room.rowStart && row <= room.rowEnd
  )) ?? null;
}

function isRoomRevealed(roomId: string, revealedRooms: string[]): boolean {
  return revealedRooms.includes(roomId) || (roomId === 'sala4b' && revealedRooms.includes('sala4a'));
}

function saveSession(data: { modoHistoria: any; mision: any; personaje: any; jugadorActual: any }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function TableroStoryMode() {
  const location = useLocation();

  const rawState = (location.state as any) ?? {};

  const savedRef = useRef<any>(null);
  if (!savedRef.current) {
    savedRef.current = loadSession();
  }
  const fallback = savedRef.current ?? {};

  const modoHistoria    = rawState.modoHistoria    ?? fallback.modoHistoria    ?? null;
  const mision          = rawState.mision          ?? fallback.mision          ?? null;
  const personaje       = rawState.personaje        ?? fallback.personaje        ?? null;
  const jugadorActual   = rawState.jugadorActual   ?? rawState.personaje       ?? fallback.jugadorActual ?? fallback.personaje ?? null;
  const esMaster        = rawState.rol === 'master';

  const [panelAbierto, setPanelAbierto] = useState(true);
  const [showIntroModal, setShowIntroModal] = useState(esMaster);
  const introTriggeredRef = useRef(esMaster);
  const [participantes, setParticipantes] = useState<{ personajeId: number; nombrePersonaje: string; nombreUsuario: string; ordenUnion?: number; clase?: string; saludActual?: number; saludMax?: number }[]>([]);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<any>(null);
  const [nombreMasterUsuario, setNombreMasterUsuario] = useState<string | null>(null);

  const nombreMaster = nombreMasterUsuario ?? personaje?.nombre ?? jugadorActual?.nombre ?? 'Personaje';
  const [movimientoRoll, setMovimientoRoll] = useState<number | null>(null);
  const [ataqueRollado, setAtaqueRollado] = useState(false);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const [connectionSecondsLeft, setConnectionSecondsLeft] = useState(120);
  const [activeEnemyIds, setActiveEnemyIds] = useState<Set<string>>(new Set());
  const [enemyToOpenId, setEnemyToOpenId] = useState<string | null>(null);
  const [searchTrapFeedback, setSearchTrapFeedback] = useState<string | null>(null);
  const [configPartidaInitial, setConfigPartidaInitial] = useState(rawState.configPartida ?? null);
  const [defeatQueue, setDefeatQueue] = useState<DefeatEvent[]>([]);
  const [activeDefeatModal, setActiveDefeatModal] = useState<DefeatEvent | null>(null);
  const [hiddenPlayerIds, setHiddenPlayerIds] = useState<Set<string>>(new Set());
  const [hiddenEnemyIds, setHiddenEnemyIds] = useState<Set<string>>(new Set());
  const [victoryModalOpen, setVictoryModalOpen] = useState(false);
  const searchTrapFeedbackTimeoutRef = useRef<number | null>(null);
  const announcedPlayerDefeatRef = useRef<Set<string>>(new Set());
  const announcedEnemyDefeatRef = useRef<Set<string>>(new Set());
  const processedDefeatModalRef = useRef<Set<string>>(new Set());
  const emittedVictoryRef = useRef(false);
  const skippedTurnRef = useRef<string | null>(null);

  const navigate = useNavigate();

  // Recuperar configPartida del sessionStorage si el master reingresa sin ella en location.state
  useEffect(() => {
    if (!configPartidaInitial && esMaster && mision?.id) {
      try {
        const saved = sessionStorage.getItem(`mission_config_${mision.id}`);
        if (saved) {
          setConfigPartidaInitial(JSON.parse(saved));
        }
      } catch {}
    }
  }, [esMaster, mision?.id, configPartidaInitial]);

  const {
    jugadoresSincronizados,
    conectado,
    tokenMoves,
    turnoActual,
    dadosRoll,
    masterListo,
    configPartida,
    kickedOut,
    revealedRooms,
    enemyHpMap,
    playerHpMap,
    defeatedPlayerIds,
    defeatedEnemyIds,
    victoryState,
    sendTokenMove,
    sendFinTurno,
    sendIniciarRonda,
    sendDadoMovimiento,
    sendDadoAtaque,
    sendChatMessage,
    sendMasterAbort,
    sendRoomRevealed,
    sendEnemyMove,
    sendEnemyHpUpdate,
    sendPlayerHpUpdate,
    sendPlayerDefeated,
    sendEnemyDefeated,
    sendVictory,
    removedTrapIds,
    revealedTrapIds,
    mensajes,
    pushLocalChatMessage,
    blockedCells,
    sendTrapRemoved,
    sendTrapRevealed,
    sendCellBlocked,
  } = useStoryModeSync(mision?.id, jugadorActual, rawState.jugadores ?? [], esMaster, configPartidaInitial);
  void conectado;

  useEffect(() => {
    if (mision?.id && (jugadorActual || esMaster)) {
      saveSession({ modoHistoria, mision, personaje, jugadorActual });
    }
  }, [mision?.id, jugadorActual?.id ?? jugadorActual?.personajeId]);

  useEffect(() => {
    if (!mision?.id) return;
    fetch(`${API_URL}/api/misiones/${mision.id}/participantes/master-info`, {
      headers: Object.fromEntries(authHeaders().entries()),
    })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { nombreUsuario?: string } | null) => {
        if (data?.nombreUsuario) setNombreMasterUsuario(data.nombreUsuario);
      })
      .catch(() => {});
  }, [mision?.id]);

  const esperandoMaster = !esMaster && masterListo !== true;
  
  // Detectar si la partida ya existe (hay otros jugadores/master) vs. siendo creada
  const partidaYaExiste = jugadoresSincronizados.length > 0;

  useEffect(() => {
    if (kickedOut) {
      sessionStorage.removeItem('tsm_session');
      navigate('/join/story-mode', { replace: true });
    }
  }, [kickedOut, navigate]);

  useEffect(() => {
    if (!esMaster && masterListo === true && !introTriggeredRef.current) {
      introTriggeredRef.current = true;
      setShowIntroModal(true);
    }
  }, [masterListo, esMaster]);

  useEffect(() => {
    if (masterListo === true && connectionTimedOut) {
      setConnectionTimedOut(false);
    }
  }, [connectionTimedOut, masterListo]);

  useEffect(() => {
    return () => {
      if (searchTrapFeedbackTimeoutRef.current != null) {
        window.clearTimeout(searchTrapFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleTimeoutLeave = useCallback(() => {
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? personaje?.id;

    if (mision?.id && personajeId != null) {
      fetch(`${API_URL}/api/misiones/${mision.id}/participantes/by-personaje/${personajeId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(() => {});
    }

    sessionStorage.removeItem('tsm_session');
    setConnectionTimedOut(false);

    if (modoHistoria?.id && mision?.id) {
      navigate(buildMissionDetailsPath(modoHistoria.id, mision.id), {
        replace: true,
        state: { modoHistoria, mision },
      });
    } else {
      navigate('/join/story-mode', { replace: true });
    }
  }, [jugadorActual?.id, jugadorActual?.personajeId, modoHistoria?.id, mision?.id, navigate, personaje?.id]);

  const handleTimeoutKeepWaiting = useCallback(() => {
    setConnectionTimedOut(false);
  }, []);

  useEffect(() => {
    if (esMaster || masterListo === true || connectionTimedOut) return;

    const startedAt = Date.now();
    const deadline = startedAt + 120000;
    setConnectionSecondsLeft(120);

    const abortConnection = () => {
      setConnectionTimedOut(true);
    };

    const intervalId = window.setInterval(() => {
      const remainingMs = deadline - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setConnectionSecondsLeft(remainingSeconds);

      if (remainingMs <= 0) {
        window.clearInterval(intervalId);
        abortConnection();
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [connectionTimedOut, esMaster, masterListo, jugadorActual, mision?.id, personaje?.id]);

  const formatConnectionTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!turnoActual?.turnoActualPersonajeId) {
      setMovimientoRoll(null);
      setAtaqueRollado(false);
      return;
    }
    const pid = turnoActual.turnoActualPersonajeId.toString();
    const entrada = dadosRoll[pid];
    setMovimientoRoll(entrada?.movimiento ?? null);
    setAtaqueRollado(entrada?.ataque != null);
  }, [turnoActual?.turnoActualPersonajeId, dadosRoll]);

  const handleMovimientoRollResult = (resultado: number) => {
    setMovimientoRoll(resultado);
    const pid = jugadorActual?.personajeId ?? jugadorActual?.id;
    if (pid != null) sendDadoMovimiento(Number(pid), resultado);
  };

  const movimientoRollRef = useRef<number | null>(null);
  movimientoRollRef.current = movimientoRoll;

  const handleMovimientoUsed = useCallback((steps: number) => {
    if (movimientoRollRef.current === null) return;
    const pid = jugadorActual?.personajeId ?? jugadorActual?.id;
    if (pid == null) return;
    const remaining = Math.max(0, movimientoRollRef.current - steps);
    setMovimientoRoll(remaining);
    sendDadoMovimiento(Number(pid), remaining);
  }, [jugadorActual, sendDadoMovimiento]);

  const handleAtaqueRollResult = (cantidadResultados: number) => {
    setAtaqueRollado(true);
    const pid = jugadorActual?.personajeId ?? jugadorActual?.id;
    if (pid != null) sendDadoAtaque(Number(pid), cantidadResultados);
  };

  const activeEnemyTokens = useMemo(() => {
    const enemyTokens = configPartida?.enemigos ?? [];
    if (enemyTokens.length === 0) return [];
    if (activeEnemyIds.size === 0) return [];
    return enemyTokens.filter(enemy => activeEnemyIds.has(enemy.instanciaId));
  }, [activeEnemyIds, configPartida?.enemigos]);

  const handlePlayerTokenClick = useCallback((token: BoardToken) => {
    const p = participantes.find(part => part.personajeId.toString() === token.id);
    const jugadorSync = jugadoresSincronizados.find((j: any) =>
      j.personajeId?.toString() === token.id ||
      j.id?.toString() === token.id
    );
    setSelectedPlayerModal({
      id: token.id,
      color: token.color,
      avatarUrl: token.avatarUrl,
      nombre: p?.nombrePersonaje ?? token.initials,
      clase: p?.clase ?? jugadorSync?.clase ?? 'Aventurero',
      hp: p?.saludActual ?? jugadorSync?.hp ?? 10,
      hpMax: p?.saludMax ?? jugadorSync?.hpMax ?? 10,
      col: token.col,
      row: token.row,
      fuerza: jugadorSync?.fuerza,
      destreza: jugadorSync?.destreza,
      constitucion: jugadorSync?.constitucion,
      inteligencia: jugadorSync?.inteligencia,
      sabiduria: jugadorSync?.sabiduria,
      carisma: jugadorSync?.carisma,
    });
  }, [participantes, jugadoresSincronizados]);

  const handleBuscarTrampa = useCallback(() => {
    if (!selectedPlayerModal) return;

    if (searchTrapFeedbackTimeoutRef.current != null) {
      window.clearTimeout(searchTrapFeedbackTimeoutRef.current);
      searchTrapFeedbackTimeoutRef.current = null;
    }

    const showSearchTrapFeedback = (message: string) => {
      setSearchTrapFeedback(message);
      searchTrapFeedbackTimeoutRef.current = window.setTimeout(() => {
        setSearchTrapFeedback(null);
        searchTrapFeedbackTimeoutRef.current = null;
      }, 3000);
    };

    const originCol = Number(selectedPlayerModal.col);
    const originRow = Number(selectedPlayerModal.row);
    if (Number.isNaN(originCol) || Number.isNaN(originRow)) {
      showSearchTrapFeedback('No encontró ninguna trampa en la zona.');
      return;
    }

    const traps = (configPartida?.trampas ?? []).filter((trap) => !removedTrapIds?.has(trap.instanciaId));
    const originRoom = getRoomForCell(originCol, originRow);
    const trapsToReveal = traps.filter((trap) => {
      const trapRoom = getRoomForCell(trap.col, trap.row);
      const sameRoom = Boolean(originRoom && trapRoom && originRoom.id === trapRoom.id);

      if (sameRoom && originRoom && isRoomRevealed(originRoom.id, revealedRooms)) {
        return true;
      }

      const deltaCol = Math.abs(trap.col - originCol);
      const deltaRow = Math.abs(trap.row - originRow);
      const isOrthogonalRange = (trap.col === originCol && deltaRow <= 10) || (trap.row === originRow && deltaCol <= 10);
      if (!isOrthogonalRange) return false;

      if (trapRoom && !isRoomRevealed(trapRoom.id, revealedRooms)) {
        return Boolean(originRoom && isRoomRevealed(originRoom.id, revealedRooms) && originRoom.id === trapRoom.id);
      }

      return true;
    });

    if (trapsToReveal.length === 0) {
      showSearchTrapFeedback('No encontró ninguna trampa en la zona.');
      return;
    }

    if (searchTrapFeedbackTimeoutRef.current != null) {
      window.clearTimeout(searchTrapFeedbackTimeoutRef.current);
      searchTrapFeedbackTimeoutRef.current = null;
    }
    setSearchTrapFeedback(null);
    trapsToReveal.forEach((trap) => {
      sendTrapRevealed(trap.instanciaId);
    });
  }, [configPartida?.trampas, removedTrapIds, revealedRooms, sendTrapRevealed, selectedPlayerModal]);

  const puedeBuscarTrampa = useMemo(() => {
    if (!selectedPlayerModal || !turnoActual?.turnoActualPersonajeId) return false;
    if (turnoActual.fase !== 'personajes') return false;
    return String(selectedPlayerModal.id) === String(turnoActual.turnoActualPersonajeId);
  }, [selectedPlayerModal, turnoActual?.fase, turnoActual?.turnoActualPersonajeId]);

  const trampasReveladasAdyacentes = useMemo(() => {
    if (!selectedPlayerModal) return [] as { instanciaId: string; col: number; row: number }[];

    const originCol = Number(selectedPlayerModal.col);
    const originRow = Number(selectedPlayerModal.row);
    if (Number.isNaN(originCol) || Number.isNaN(originRow)) return [];

    return (configPartida?.trampas ?? []).filter((trap) => {
      if (!revealedTrapIds?.has(trap.instanciaId)) return false;
      if (removedTrapIds?.has(trap.instanciaId)) return false;

      const deltaCol = Math.abs(trap.col - originCol);
      const deltaRow = Math.abs(trap.row - originRow);
      return (deltaCol === 1 && deltaRow === 0) || (deltaCol === 0 && deltaRow === 1);
    });
  }, [configPartida?.trampas, removedTrapIds, revealedTrapIds, selectedPlayerModal]);

  // Force modal re-evaluation when the active turn or the local jugadorActual changes.
  // This ensures action buttons (Buscar/Desactivar trampa) appear immediately when the turn moves to the next player.
  useEffect(() => {
    if (!selectedPlayerModal) return;
    // recreate the object reference so dependent useMemo/useCallback recompute reliably
    setSelectedPlayerModal((prev: any) => prev ? { ...prev } : prev);
  }, [turnoActual?.turnoActualPersonajeId, turnoActual?.fase, jugadorActual?.id, jugadorActual?.personajeId]);

  const puedeDesactivarTrampa = useMemo(() => {
    return puedeBuscarTrampa && trampasReveladasAdyacentes.length > 0;
  }, [puedeBuscarTrampa, trampasReveladasAdyacentes.length]);

  const handleDesactivarTrampa = useCallback(() => {
    if (!puedeDesactivarTrampa) return;

    const trapToRemove = trampasReveladasAdyacentes[0];
    if (!trapToRemove) return;

    sendTrapRemoved(trapToRemove.instanciaId);
    setSearchTrapFeedback(null);
  }, [puedeDesactivarTrampa, sendTrapRemoved, trampasReveladasAdyacentes]);

  const playerRoster = useMemo(() => {
    const fromParticipantes = participantes.map((p) => ({
      id: String(p.personajeId),
      nombre: p.nombrePersonaje,
      color: colorForOrden(p.ordenUnion),
      avatarUrl: resolveAvatarUrl((p as any).avatar ?? null),
      orden: p.ordenUnion ?? 0,
    }));
    if (fromParticipantes.length > 0) return fromParticipantes;
    return jugadoresSincronizados
      .map((j: any) => ({
        id: String(j.personajeId ?? j.id),
        nombre: j.nombre ?? 'Aventurero',
        color: j.color ?? '#4a90d9',
        avatarUrl: resolveAvatarUrl(j.avatar ?? null),
        orden: j.ordenUnion ?? 0,
      }))
      .sort((a, b) => a.orden - b.orden);
  }, [jugadoresSincronizados, participantes]);

  useEffect(() => {
    playerRoster.forEach((player) => {
      const hp = playerHpMap[player.id];
      if (hp === undefined || hp > 0) return;
      if (announcedPlayerDefeatRef.current.has(player.id)) return;
      announcedPlayerDefeatRef.current.add(player.id);
      sendPlayerDefeated(player.id);
    });
  }, [playerHpMap, playerRoster, sendPlayerDefeated]);

  useEffect(() => {
    const enemies = configPartida?.enemigos ?? [];
    enemies.forEach((enemy) => {
      const hp = enemyHpMap[enemy.instanciaId];
      if (hp === undefined || hp > 0) return;
      if (announcedEnemyDefeatRef.current.has(enemy.instanciaId)) return;
      announcedEnemyDefeatRef.current.add(enemy.instanciaId);
      sendEnemyDefeated(enemy.instanciaId);
    });
  }, [configPartida?.enemigos, enemyHpMap, sendEnemyDefeated]);

  useEffect(() => {
    const toAdd: DefeatEvent[] = [];
    defeatedPlayerIds.forEach((playerId) => {
      const marker = `player:${playerId}`;
      if (processedDefeatModalRef.current.has(marker)) return;
      processedDefeatModalRef.current.add(marker);
      const player = playerRoster.find((p) => p.id === playerId);
      toAdd.push({
        type: 'player',
        id: playerId,
        nombre: player?.nombre ?? 'Personaje',
        color: player?.color ?? '#4a90d9',
        avatarUrl: player?.avatarUrl ?? '/images/avatar-login.png',
      });
    });
    defeatedEnemyIds.forEach((enemyId) => {
      const marker = `enemy:${enemyId}`;
      if (processedDefeatModalRef.current.has(marker)) return;
      processedDefeatModalRef.current.add(marker);
      const enemy = (configPartida?.enemigos ?? []).find((e) => e.instanciaId === enemyId);
      toAdd.push({
        type: 'enemy',
        id: enemyId,
        nombre: enemy?.nombre ?? 'Enemigo',
        imageUrl: getEnemyImageSrc(enemy?.nombre),
      });
    });
    if (toAdd.length > 0) {
      setDefeatQueue((prev) => [...prev, ...toAdd]);
    }
  }, [configPartida?.enemigos, defeatedEnemyIds, defeatedPlayerIds, playerRoster]);

  useEffect(() => {
    if (activeDefeatModal || defeatQueue.length === 0) return;
    const [next, ...rest] = defeatQueue;
    setActiveDefeatModal(next);
    setDefeatQueue(rest);
  }, [activeDefeatModal, defeatQueue]);

  useEffect(() => {
    if (!esMaster) return;
    if (turnoActual?.fase !== 'personajes' || !turnoActual.turnoActualPersonajeId) {
      skippedTurnRef.current = null;
      return;
    }
    const turnId = String(turnoActual.turnoActualPersonajeId);
    if (!hiddenPlayerIds.has(turnId)) {
      skippedTurnRef.current = null;
      return;
    }
    if (skippedTurnRef.current === turnId) return;
    skippedTurnRef.current = turnId;
    sendFinTurno(turnoActual.turnoActualPersonajeId);
  }, [esMaster, hiddenPlayerIds, sendFinTurno, turnoActual?.fase, turnoActual?.turnoActualPersonajeId]);

  useEffect(() => {
    if (!esMaster || emittedVictoryRef.current) return;
    if (!victoryState) {
      const totalPlayers = playerRoster.length;
      const totalEnemies = (configPartida?.enemigos ?? []).length;

      if (totalPlayers > 0 && defeatedPlayerIds.size >= totalPlayers) {
        emittedVictoryRef.current = true;
        sendVictory('master', 'Todos los personajes han sido derrotados');
        return;
      }

      if (totalEnemies > 0 && defeatedEnemyIds.size >= totalEnemies) {
        emittedVictoryRef.current = true;
        sendVictory('personajes', 'Todos los enemigos han sido derrotados');
      }
    }
  }, [configPartida?.enemigos, defeatedEnemyIds.size, defeatedPlayerIds.size, esMaster, playerRoster.length, sendVictory, victoryState]);

  useEffect(() => {
    if (victoryState) {
      setVictoryModalOpen(true);
    }
  }, [victoryState]);

  const handleCloseDefeatModal = useCallback(() => {
    if (!activeDefeatModal) return;
    if (activeDefeatModal.type === 'player') {
      const defeatedId = String(activeDefeatModal.id);
      if (esMaster) {
        sendChatMessage({
          autor: 'Sistema',
          texto: `${activeDefeatModal.nombre} ha sido eliminado de la partida.`,
          tipo: 'sistema',
        });
      }
      setHiddenPlayerIds((prev) => new Set([...prev, defeatedId]));
      setSelectedPlayerModal((prev: any) => {
        if (!prev) return prev;
        return String(prev.id) === defeatedId ? null : prev;
      });
    } else {
      const defeatedEnemyId = String(activeDefeatModal.id);
      setHiddenEnemyIds((prev) => new Set([...prev, defeatedEnemyId]));
      if (enemyToOpenId === defeatedEnemyId) {
        setEnemyToOpenId(null);
      }
    }
    setActiveDefeatModal(null);
  }, [activeDefeatModal, enemyToOpenId, esMaster, sendChatMessage]);

  const visibleEnemyTokens = useMemo(() => {
    return activeEnemyTokens.filter((enemy) => !hiddenEnemyIds.has(enemy.instanciaId));
  }, [activeEnemyTokens, hiddenEnemyIds]);

  return (
    <div className="tb-page tsm-page">
      <PanelLateralStoryMode
        modoHistoria={modoHistoria}
        mision={mision}
        personaje={personaje}
        jugadoresSincronizados={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        participantes={participantes}
        enemyTokens={visibleEnemyTokens}
        abierto={panelAbierto}
        onToggle={() => setPanelAbierto(!panelAbierto)}
        esMaster={esMaster}
        onMasterAbort={sendMasterAbort}
        onAbandonarConfirmado={(nombrePersonaje) => {
          sendChatMessage({ autor: 'Sistema', texto: `${nombrePersonaje} abandonó la misión` });
        }}
        openEnemyInstanceId={enemyToOpenId}
        onCloseEnemyModal={() => setEnemyToOpenId(null)}
        enemyHpMap={enemyHpMap}
        onEnemyHpChange={sendEnemyHpUpdate}
        onShowIntro={() => setShowIntroModal(true)}
      />

      <TableroCentroStoryMode
        personaje={personaje}
        mision={mision}
        jugadoresSincronizados={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        tokenMoves={tokenMoves}
        sendTokenMove={sendTokenMove}
        turnoActual={turnoActual}
        sendFinTurno={sendFinTurno}
        onParticipantesLoaded={setParticipantes}
        movimientoRoll={movimientoRoll}
        onMovimientoUsed={handleMovimientoUsed}
        configPartida={configPartida}
        bloqueado={esperandoMaster || connectionTimedOut}
        esMaster={esMaster}
        revealedRooms={revealedRooms}
        onRoomRevealed={sendRoomRevealed}
        onEnemyMove={sendEnemyMove}
        onMasterFinTurno={sendIniciarRonda}
        nombreMaster={nombreMaster}
        onActiveEnemiesChange={setActiveEnemyIds}
        onOpenEnemyDetails={(id: string) => {
          setPanelAbierto(true);
          setEnemyToOpenId(id);
        }}
        hiddenPlayerIds={hiddenPlayerIds}
        hiddenEnemyIds={hiddenEnemyIds}
        removedTrapIds={removedTrapIds}
        revealedTrapIds={revealedTrapIds}
        blockedCells={blockedCells}
        onCellBlocked={sendCellBlocked}
        onTrapTriggered={(instanciaId, _outcome) => {
          sendTrapRemoved(instanciaId);
        }}
        onPlayerTokenClick={handlePlayerTokenClick}
      />

      <PanelPartidaStoryMode
        nombreMaster={nombreMaster}
        jugadores={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        campanaId={mision?.id}
        esMaster={esMaster}
        turnoActual={turnoActual}
        onMovimientoRollResult={handleMovimientoRollResult}
        movimientoYaLanzado={movimientoRoll !== null}
        onAtaqueRollResult={handleAtaqueRollResult}
        ataqueYaLanzado={ataqueRollado}
        playerHpMap={playerHpMap}
        onPlayerHpUpdate={sendPlayerHpUpdate}
        mensajes={mensajes}
        pushLocalChatMessage={pushLocalChatMessage}
        sendChatMessage={sendChatMessage}
      />

      {esperandoMaster && !connectionTimedOut && (
        <div className="tsm-waiting-overlay">
          <div className="tsm-waiting-modal">
            <p className="tsm-waiting-text">
              {partidaYaExiste
                ? 'Esperando la conexión del master para poder jugar...'
                : 'El master está preparando la partida, por favor espera...'}
            </p>
            <p className="tsm-waiting-text">Tiempo restante: {formatConnectionTime(connectionSecondsLeft)}</p>
            <div className="gb-master-loader tsm-waiting-spinner" aria-label="Esperando al master">
              <span className="dot d1" /><span className="dot d2" /><span className="dot d3" /><span className="dot d4" />
              <span className="dot d5" /><span className="dot d6" /><span className="dot d7" /><span className="dot d8" />
            </div>
          </div>
        </div>
      )}

      {showIntroModal && (
        <div className="tsm-intro-overlay" role="dialog" aria-modal="true">
          <div className={`tsm-intro-modal${esMaster ? ' tsm-intro-modal--master' : ''}`}>

            <div className="tsm-intro-header">
              <h2 className="tsm-intro-title">
                {esMaster ? '¡Bienvenido, Maestro!' : '¡Bienvenidos Aventureros!'}
              </h2>
              <p className="tsm-intro-subtitle">
                {esMaster ? 'Rol · Master' : 'Rol · Personaje'}
              </p>
              <div className="tsm-intro-divider" />
            </div>

            {esMaster ? (
              <p className="tsm-intro-text">
                En tus manos queda que los aventureros sigan tu guía, pero tu victoria se decide por su fracaso...
                Serás el encargado de guiar a tus secuaces por el escenario y tratar de derrotar a los aventureros,
                antes de que ellos puedan derrotar a tus esbirros y avanzar en su lucha hacia el castillo Ravenloft.
                Tendrás que intentar engañar a los aventureros para que pisen tus trampas y resolver con tus tiradas
                los combates que os esperan.
              </p>
            ) : (
              <p className="tsm-intro-text">
                El Master ha diseñado cada rincón con un propósito: haceros fracasar. Vuestra única ventaja es
                la coordinación entre aventureros y la capacidad de leer el tablero antes de actuar.
                Avanzad con orden, explorad cada sala y, sobre todo, comunicaos entre vosotros para
                elegir los caminos correctos. Cuando un enemigo quede adyacente a vosotros, el
                combate se iniciará. Deberéis resolver las tiradas de dados de ataque y defensa que os correspondan. ¿Fracasaréis?
                ¿Venceréis? Confiar en la palabra del Master para avanzar por los pasillos...o puede que su palabra no sea tan fiable...
              </p>
            )}

            <div className="tsm-intro-objectives">
              <p className="tsm-intro-objectives-title">
                {esMaster ? 'Tus herramientas' : 'Objetivos de la misión'}
              </p>

              {esMaster ? (
                <>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Mueve tus enemigos estratégicamente para interceptar y bloquear el avance de los aventureros
                    </span>
                  </div>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Tus trampas son <strong>invisibles para los jugadores</strong> — solo tú puedes verlas en el tablero
                    </span>
                  </div>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Al revelar una sala, tus enemigos se activan automáticamente y entran en combate
                    </span>
                  </div>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Tu turno llega cuando todos los personajes han terminado el suyo — aprovéchalo al máximo
                    </span>
                  </div>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Pulsa sobre un enemigo en el panel lateral para gestionar sus puntos de vida y estado
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Localizar y derrotar a todos los enemigos del mapa
                    </span>
                  </div>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Buscar y desactivar las trampas antes de que alguien las active sin querer
                    </span>
                  </div>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Explorar las salas ocultas abriendo sus puertas y avanzando juntos como equipo
                    </span>
                  </div>
                  <div className="tsm-intro-objective">
                    <span className="tsm-intro-objective-text">
                      Coordinar el orden de turno para maximizar el movimiento y elegir bien los combates
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="tsm-intro-warning">
              <p className="tsm-intro-warning-text">
                <span className="tsm-intro-warning-label">
                  {esMaster ? 'Recuerda' : 'Atención'}
                </span>
                {esMaster
                  ? 'Serás el encargado de reducir la vida de tus secuaces cuando estos sean derrotados por los personajes, puedes inventarte retos originales en tu turno para imponer a los personajes y que estos puedan resolver a ver si retrasas su aventura, inventa con ingenio.'
                  : 'Seréis los encargados de reducir vuestra vida cuando corresponda, respetar los retos propuestos por el máster impuestos en su turno para una mejor diversión. Las trampas son completamente invisibles para vosotros, pisad con extrema precaución en zonas desconocidas y desactivad antes de que alguien salga herido.'
                }
              </p>
            </div>

            <button
              type="button"
              className="tsm-intro-btn"
              onClick={() => {
                setShowIntroModal(false);
              }}
            >
              {esMaster ? '¡Buena suerte, Máster!' : '¡Buena suerte, Aventureros!'}
            </button>

          </div>
        </div>
      )}

      {selectedPlayerModal && createPortal(
        <div className="pp-player-modal-overlay" onClick={() => setSelectedPlayerModal(null)}>
          <div
            className="pp-player-modal"
            style={{
              background: `radial-gradient(circle at top, ${selectedPlayerModal.color}38 0%, transparent 50%), linear-gradient(180deg, rgba(10,3,3,0.99) 0%, rgba(4,1,1,0.99) 100%)`,
              borderColor: `${selectedPlayerModal.color}55`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="pp-player-modal-portrait"
              style={{ borderColor: selectedPlayerModal.color, boxShadow: `0 0 28px ${selectedPlayerModal.color}44` }}
            >
              {selectedPlayerModal.avatarUrl
                ? <img src={selectedPlayerModal.avatarUrl} alt={selectedPlayerModal.nombre} className="pp-jugador-avatar" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/avatar-login.png'; }} />
                : <div className="pp-jugador-avatar-placeholder">{(selectedPlayerModal.nombre as string).charAt(0)}</div>
              }
            </div>

            <h3 className="pp-player-modal-title" style={{ color: selectedPlayerModal.color }}>
              {selectedPlayerModal.nombre}
            </h3>
            <p className="pp-player-modal-clase">{selectedPlayerModal.clase}</p>

            {(() => {
              const hpActual = playerHpMap[selectedPlayerModal.id] ?? selectedPlayerModal.hp;
              return (
                <div className="pp-player-modal-hp">
                  <div className="tsm-enemy-hp-bar-track tsm-enemy-hp-bar-track--modal">
                    <div
                      className="tsm-enemy-hp-bar-fill"
                      style={{ width: `${(hpActual / selectedPlayerModal.hpMax) * 100}%` }}
                    />
                  </div>
                  <span className="tsm-enemy-hp-text tsm-enemy-hp-text--modal">
                    {hpActual} / {selectedPlayerModal.hpMax} HP
                  </span>
                </div>
              );
            })()}

            {(() => {
              const sumaAtaque  = (selectedPlayerModal.fuerza ?? 10) + (selectedPlayerModal.destreza ?? 10) + (selectedPlayerModal.constitucion ?? 10);
              const sumaDefensa = (selectedPlayerModal.inteligencia ?? 10) + (selectedPlayerModal.sabiduria ?? 10) + (selectedPlayerModal.carisma ?? 10);
              const dadosAtaque  = sumaAtaque  <= 30 ? 1 : sumaAtaque  <= 50 ? 2 : 3;
              const dadosDefensa = sumaDefensa <= 30 ? 1 : sumaDefensa <= 50 ? 2 : 3;
              const diceFile = (n: number) => n === 1 ? 'dado' : n === 2 ? '2dados' : '3dados';
              return (
                <div className="pp-player-modal-combat">
                  <div className="pp-player-modal-combat-block">
                    <span className="pp-player-modal-combat-label" style={{ color: 'rgba(220,100,80,0.9)' }}>ATA</span>
                    <img src={`/images/dadosModHistoria/${diceFile(dadosAtaque)}.png`} alt={`${dadosAtaque} dado(s) ataque`} className="pp-player-modal-dice-img" />
                  </div>
                  <div className="pp-player-modal-combat-block">
                    <span className="pp-player-modal-combat-label" style={{ color: 'rgba(90,160,230,0.9)' }}>DEF</span>
                    <img src={`/images/dadosModHistoria/${diceFile(dadosDefensa)}.png`} alt={`${dadosDefensa} dado(s) defensa`} className="pp-player-modal-dice-img" />
                  </div>
                </div>
              );
            })()}

            {(() => {
              const miPersonajeId = (jugadorActual?.personajeId ?? jugadorActual?.id)?.toString() ?? null;
              const puedeVerAccionesTrampa = miPersonajeId != null && String(selectedPlayerModal.id) === miPersonajeId;
              if (!puedeVerAccionesTrampa) return null;
              return (
                <div className="pp-player-modal-actions">
                  <button type="button" className="pp-player-modal-action-btn" onClick={handleBuscarTrampa} disabled={!puedeBuscarTrampa}>
                    Buscar trampa
                  </button>
                  {searchTrapFeedback && (
                    <p className="pp-player-search-feedback">
                      {searchTrapFeedback}
                    </p>
                  )}
                  <button type="button" className="pp-player-modal-action-btn" onClick={handleDesactivarTrampa} disabled={!puedeDesactivarTrampa}>
                    Desactivar trampa
                  </button>
                  <button type="button" className="pp-player-modal-action-btn pp-player-modal-action-btn--close" onClick={() => setSelectedPlayerModal(null)}>
                    Cerrar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      <ModalAlert
        isOpen={Boolean(activeDefeatModal)}
        title={activeDefeatModal?.type === 'player' ? 'Personaje derrotado' : 'Enemigo derrotado'}
        message={activeDefeatModal
          ? (activeDefeatModal.type === 'player'
            ? `${activeDefeatModal.nombre} ha sido derrotado y queda eliminado de la ronda.`
            : `${activeDefeatModal.nombre} ha sido derrotado y desaparece del tablero.`)
          : ''}
        confirmText="Cerrar"
        onConfirm={handleCloseDefeatModal}
        showImage={false}
        media={activeDefeatModal ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="modal-conflict-avatar"
              style={{ borderColor: activeDefeatModal.type === 'player' ? (activeDefeatModal.color ?? '#4a90d9') : 'rgba(200,70,50,0.95)' }}
            >
              {activeDefeatModal.type === 'player'
                ? (
                  activeDefeatModal.avatarUrl
                    ? <img src={activeDefeatModal.avatarUrl} alt={activeDefeatModal.nombre} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/avatar-login.png'; }} />
                    : <span className="initials">{activeDefeatModal.nombre.charAt(0)}</span>
                )
                : <img src={activeDefeatModal.imageUrl ?? '/images/icons/rolo_triste.png'} alt={activeDefeatModal.nombre} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/icons/rolo_triste.png'; }} />}
            </div>
          </div>
        ) : null}
      />

      <ModalAlert
        isOpen={victoryModalOpen}
        title={victoryState?.ganador === 'master' ? 'Victoria del Master' : 'Victoria de los Personajes'}
        message={victoryState?.ganador === 'master'
          ? (esMaster
            ? '¡Enhorabuena Master! gracias a tus esfuerzos obtienes la victoria sobre tus enemigos, puedes celebrarlo con orgullo.'
            : 'Todos los aventureros han sido derrotados. El Master gana la partida.')
          : (!esMaster
            ? '¡Enhorabuena Personaje! gracias a tus esfuerzos obtienes la victoria sobre tus enemigos, puedes celebrarlo con orgullo.'
            : 'Todos los enemigos del tablero han sido derrotados. ¡Los personajes ganan la partida!')}
        confirmText="Cerrar"
        onConfirm={() => setVictoryModalOpen(false)}
        showImage={false}
      />

      <ModalAlert
        isOpen={connectionTimedOut}
        title="Conexión no establecida"
        message="No se consiguió conectar con la partida en 2 minutos. Puedes salir para volver a seleccionar tu personaje o seguir esperando un poco más."
        confirmText="Salir"
        cancelText="Seguir esperando"
        onConfirm={handleTimeoutLeave}
        onCancel={handleTimeoutKeepWaiting}
      />
    </div>
  );
}
