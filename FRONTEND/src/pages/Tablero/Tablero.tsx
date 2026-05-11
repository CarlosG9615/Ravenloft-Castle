import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image, Line, Circle, Text, Group, Rect } from 'react-konva';
import { PanelPartida } from './PanelPartida';
import { obtenerCampanaPorId } from '../../services/campanaService';
import { getPersonajes } from '../../services/personajeService';
import { getAvatarUrl, getCartaUrl } from '../../utils/imageUtils';
import useImage from 'use-image';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './Tablero.css';

interface Token {
  id: string;
  x: number;
  y: number;
  color: string;
  nombre: string;
  tipo: 'jugador' | 'enemigo' | 'npc';
  ownerId?: string | number | null;
}

interface TokenMovePayload {
  tokenId: string;
  ownerId?: string | number | null;
  tipo: 'jugador' | 'enemigo' | 'npc';
  nombre?: string;
  color?: string;
  col: number;
  row: number;
  mapaUrl?: string | null;
}

interface TokenDeletePayload {
  tokenId: string;
  mapaUrl?: string | null;
}

const COLORES_TOKEN = {
  jugador: '#4a90d9',
  enemigo: '#e74c3c',
  npc:     '#2ecc71',
};

const TAMANYO_CELDA = 50;
const MAPA_ANCHO    = 2400;
const MAPA_ALTO     = 1600;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const isDataUrl = (value: string) => /^data:/i.test(value);
const isAppPath = (value: string) => value.startsWith('/');

const resolveAvatarUrl = (avatar?: string | null): string | null => {
  if (!avatar) return null;
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
  return getAvatarUrl(avatar);
};

const resolveCartaUrl = (avatar?: string | null): string | null => {
  if (!avatar) return null;
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
  return getCartaUrl(avatar);
};

function MapaFondo({ src, ancho, alto }: { src: string; ancho: number; alto: number }) {
  const [image] = useImage(src);
  return <Image image={image} x={0} y={0} width={ancho} height={alto} />;
}

function Cuadricula({ ancho, alto, celda }: { ancho: number; alto: number; celda: number }) {
  const lineas = [];
  for (let x = 0; x <= ancho; x += celda)
    lineas.push(<Line key={`v${x}`} points={[x, 0, x, alto]} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />);
  for (let y = 0; y <= alto; y += celda)
    lineas.push(<Line key={`h${y}`} points={[0, y, ancho, y]} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />);
  return <>{lineas}</>;
}

export function Tablero() {
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);
  const syncRequestedRef = useRef(false);
  const sentTokenIdsRef = useRef<Set<string>>(new Set());
  const mapaUrl         = (location.state as any)?.mapaUrl        ?? '/images/mapas/bosque/caminoForestal.jpg';
  const campaaNombre    = (location.state as any)?.campaaNombre   ?? 'Campaña';
  const campanaId       = (location.state as any)?.campanaId;
  const jugadorActual   = (location.state as any)?.jugadorActual;
  const jugadoresCampaa = (location.state as any)?.jugadores      ?? [];
  const esMaster        = (location.state as any)?.esMaster       ?? false;
  const [mapaActualUrl, setMapaActualUrl]       = useState<string>(mapaUrl);
  const [mapasDisponibles, setMapasDisponibles] = useState<string[]>([]);
  const [cargandoMapas, setCargandoMapas]       = useState(false);
  const [personaje, setPersonaje]               = useState<any>(null);
  const avatarSrc = resolveAvatarUrl(personaje?.avatar);
  const jugadorActualConAvatar = jugadorActual && !jugadorActual.avatar && personaje?.avatar
    ? { ...jugadorActual, avatar: personaje.avatar }
    : jugadorActual;

  const [dimensiones, setDimensiones] = useState({
    ancho: window.innerWidth - 300,
    alto: window.innerHeight,
  });

  const calcularScaleInicial = () => {
    const scaleX = (window.innerWidth - 300) / MAPA_ANCHO;
    const scaleY = window.innerHeight / MAPA_ALTO;
    return Math.min(scaleX, scaleY, 1);
  };

  const [scale, setScale]       = useState(calcularScaleInicial);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tokensPorMapa, setTokensPorMapa] = useState<Record<string, Token[]>>({
    [mapaUrl]: [
      { id: '1', x: 100, y: 100, color: COLORES_TOKEN.jugador, nombre: 'P1', tipo: 'jugador' },
      { id: '2', x: 200, y: 150, color: COLORES_TOKEN.jugador, nombre: 'P2', tipo: 'jugador' },
    ]
  });

  const tokens = tokensPorMapa[mapaActualUrl] || [];
  const setTokens = (updater: Token[] | ((prev: Token[]) => Token[])) => {
    setTokensPorMapa(prev => {
      const actualTokens = prev[mapaActualUrl] || [];
      const newTokens = typeof updater === 'function' ? updater(actualTokens) : updater;
      return { ...prev, [mapaActualUrl]: newTokens };
    });
  };

  const [herramienta, setHerramienta]             = useState<'mover' | 'token' | 'borrar'>('mover');
  const [tipoToken, setTipoToken]                 = useState<'jugador' | 'enemigo' | 'npc'>('jugador');
  const [tokenNombre, setTokenNombre]             = useState('');
  const [mostrarCuadricula, setMostrarCuadricula] = useState(true);
  const [panelAbierto, setPanelAbierto]           = useState(true);

  const currentPlayerId = jugadorActualConAvatar?.id ?? jugadorActualConAvatar?.personajeId ?? personaje?.id ?? null;

  const toGrid = (x: number, y: number) => ({
    col: Math.round((x - TAMANYO_CELDA / 2) / TAMANYO_CELDA),
    row: Math.round((y - TAMANYO_CELDA / 2) / TAMANYO_CELDA),
  });

  const fromGrid = (col: number, row: number) => ({
    x: col * TAMANYO_CELDA + TAMANYO_CELDA / 2,
    y: row * TAMANYO_CELDA + TAMANYO_CELDA / 2,
  });

  const canMoverToken = (token: Token) => {
    if (esMaster) return token.tipo !== 'jugador';
    return token.tipo === 'jugador' && currentPlayerId !== null && String(token.ownerId) === String(currentPlayerId);
  };

  const publishTokenMove = (token: Token, x: number, y: number) => {
    if (!campanaId || !stompRef.current?.connected) return;
    const { col, row } = toGrid(x, y);
    const payload: TokenMovePayload = {
      tokenId: token.id,
      ownerId: token.ownerId ?? null,
      tipo: token.tipo,
      nombre: token.nombre,
      color: token.color,
      col,
      row,
      mapaUrl: mapaActualUrl,
    };
    stompRef.current.publish({
      destination: `/app/campana/${campanaId}/token-move`,
      body: JSON.stringify(payload),
    });
  };

  const publishTokenDelete = (token: Token) => {
    if (!campanaId || !stompRef.current?.connected) return;
    const payload: TokenDeletePayload = {
      tokenId: token.id,
      mapaUrl: mapaActualUrl,
    };
    stompRef.current.publish({
      destination: `/app/campana/${campanaId}/token-delete`,
      body: JSON.stringify(payload),
    });
  };

  const applyTokenMove = (move: TokenMovePayload) => {
    const mapKey = move.mapaUrl || mapaActualUrl;
    const position = fromGrid(move.col, move.row);
    setTokensPorMapa(prev => {
      const actualTokens = prev[mapKey] || [];
      const idx = actualTokens.findIndex(t => t.id === move.tokenId);
      if (idx >= 0) {
        const updated = actualTokens.map(t => t.id === move.tokenId
          ? { ...t, x: position.x, y: position.y, ownerId: move.ownerId ?? t.ownerId, color: move.color || t.color, nombre: move.nombre || t.nombre, tipo: move.tipo }
          : t
        );
        return { ...prev, [mapKey]: updated };
      }
      const nuevo: Token = {
        id: move.tokenId,
        x: position.x,
        y: position.y,
        color: move.color || COLORES_TOKEN[move.tipo],
        nombre: move.nombre || move.tipo.charAt(0).toUpperCase(),
        tipo: move.tipo,
        ownerId: move.ownerId ?? null,
      };
      return { ...prev, [mapKey]: [...actualTokens, nuevo] };
    });
  };

  const applyTokenDelete = (payload: TokenDeletePayload) => {
    const mapKey = payload.mapaUrl || mapaActualUrl;
    setTokensPorMapa(prev => {
      const actualTokens = prev[mapKey] || [];
      const updated = actualTokens.filter(t => t.id !== payload.tokenId);
      if (updated.length === actualTokens.length) return prev;
      return { ...prev, [mapKey]: updated };
    });
    sentTokenIdsRef.current.delete(payload.tokenId);
  };

  const snapToGrid = (val: number) => Math.round(val / TAMANYO_CELDA) * TAMANYO_CELDA + TAMANYO_CELDA / 2;

  const [animatingTokenId, setAnimatingTokenId] = useState<string | null>(null);
  const [animPath, setAnimPath]                 = useState<{x: number, y: number}[]>([]);
  const [animStep, setAnimStep]                 = useState(0);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dragOrigin, setDragOrigin]   = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);
  const draggingRef = useRef<{ tokenId: string; origin: {x:number,y:number}; current: {x:number,y:number} } | null>(null);

  useEffect(() => {
    return () => { if (animTimerRef.current) clearTimeout(animTimerRef.current); };
  }, []);

  useEffect(() => {
    if (!esMaster) {
      getPersonajes()
        .then(personajes => {
          if (personajes.length > 0) setPersonaje(personajes[0]);
        })
        .catch(err => console.error('Error cargando personaje:', err));
    }
  }, [esMaster]);

  const buildPath = (from: {x:number, y:number}, to: {x:number, y:number}) => {
    const path = [from];
    if (from.x === to.x) {
      const dist = to.y - from.y;
      const steps = Math.abs(dist) / TAMANYO_CELDA;
      const dir = dist > 0 ? TAMANYO_CELDA : -TAMANYO_CELDA;
      for (let i = 1; i <= steps; i++) path.push({ x: from.x, y: from.y + dir * i });
    } else {
      const dist = to.x - from.x;
      const steps = Math.abs(dist) / TAMANYO_CELDA;
      const dir = dist > 0 ? TAMANYO_CELDA : -TAMANYO_CELDA;
      for (let i = 1; i <= steps; i++) path.push({ x: from.x + dir * i, y: from.y });
    }
    return path;
  };

  const constrainToAxis = (origin: {x:number, y:number}, target: {x:number, y:number}) => {
    const dx = Math.abs(target.x - origin.x);
    const dy = Math.abs(target.y - origin.y);
    return dx >= dy ? { x: target.x, y: origin.y } : { x: origin.x, y: target.y };
  };

  const startAnimation = (tokenId: string, path: {x:number, y:number}[]) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setAnimatingTokenId(tokenId);
    setAnimPath(path);
    setAnimStep(0);
    let step = 0;
    const advance = () => {
      step++;
      if (step >= path.length) {
        const to = path[path.length - 1];
        setAnimatingTokenId(null);
        setAnimPath([]);
        setAnimStep(0);
        moverToken(tokenId, to.x, to.y);
        commitTokenMove(tokenId, to.x, to.y);
        return;
      }
      moverToken(tokenId, path[step].x, path[step].y);
      setAnimStep(step);
      animTimerRef.current = setTimeout(advance, 220);
    };
    advance();
  };

  let overlayCells: {x:number, y:number, step:number}[] = [];
  if (dragCurrent && dragOrigin) {
    const path = buildPath(dragOrigin, dragCurrent);
    overlayCells = path.slice(1).map((pos, i) => ({ ...pos, step: i + 1 }));
  } else if (animatingTokenId && animPath.length > 0 && animStep > 0) {
    overlayCells = animPath.slice(1, animStep + 1).map((pos, i) => ({ ...pos, step: i + 1 }));
  }

  const handleStagePointerMove = (e: any) => {
    if (draggingRef.current) {
      const stage = stageRef.current;
      const pointer = stage.getPointerPosition();
      const x = (pointer.x - position.x) / scale;
      const y = (pointer.y - position.y) / scale;
      const raw = { x: snapToGrid(x), y: snapToGrid(y) };
      const constrained = constrainToAxis(draggingRef.current.origin, raw);
      draggingRef.current.current = constrained;
      setDragCurrent(constrained);
    }
  };

  const handleStagePointerUp = () => {
    if (draggingRef.current) {
      const { tokenId, origin, current } = draggingRef.current;
      draggingRef.current = null;
      setDragCurrent(null);
      setDragOrigin(null);
      if (origin.x !== current.x || origin.y !== current.y) {
        startAnimation(tokenId, buildPath(origin, current));
      }
    }
  };

  useEffect(() => {
    if (!campanaId) return;
    setCargandoMapas(true);
    obtenerCampanaPorId(campanaId)
      .then((campana) => {
        const mapas = campana.mapas ?? [];
        setMapasDisponibles(mapas);
        if (mapas.length > 0 && !mapas.includes(mapaUrl)) {
          setMapaActualUrl(mapas[0]);
        }
      })
      .catch(err => console.error('No se pudieron cargar los mapas:', err))
      .finally(() => setCargandoMapas(false));
  }, [campanaId]);

  useEffect(() => {
    const handleResize = () =>
      setDimensiones({ ancho: window.innerWidth - 300, alto: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage    = stageRef.current;
    const oldScale = scale;
    const pointer  = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * 1.1, 4)
      : Math.max(oldScale / 1.1, 0.2);
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleStageClick = (e: any) => {
    if (herramienta !== 'token') return;
    if (!esMaster) return;
    if (e.target !== e.target.getStage() && e.target.getClassName() !== 'Image') return;
    const stage   = stageRef.current;
    const pointer = stage.getPointerPosition();
    const x = (pointer.x - position.x) / scale;
    const y = (pointer.y - position.y) / scale;
    const nuevo: Token = {
      id: Date.now().toString(),
      x: Math.round(x / TAMANYO_CELDA) * TAMANYO_CELDA + TAMANYO_CELDA / 2,
      y: Math.round(y / TAMANYO_CELDA) * TAMANYO_CELDA + TAMANYO_CELDA / 2,
      color: COLORES_TOKEN[tipoToken],
      nombre: tokenNombre || tipoToken.charAt(0).toUpperCase(),
      tipo: tipoToken,
      ownerId: null,
    };
    setTokens(prev => [...prev, nuevo]);
    publishTokenMove(nuevo, nuevo.x, nuevo.y);
  };

  const moverToken = (id: string, x: number, y: number) =>
    setTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));

  const commitTokenMove = (tokenId: string, x: number, y: number) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    publishTokenMove(token, x, y);
  };

  const borrarToken = (id: string, opciones?: { forzar?: boolean }) => {
    if (!opciones?.forzar && herramienta !== 'borrar') return;
    const token = tokens.find(t => t.id === id);
    if (!token) return;
    if (!esMaster) return;
    setTokens(prev => prev.filter(t => t.id !== id));
    publishTokenDelete(token);
  };

  const resetearVista = () => {
    setScale(calcularScaleInicial());
    setPosition({ x: 0, y: 0 });
  };

  const nombreMapa = (url: string) =>
    url.split('/').pop()?.replace(/\.(jpg|jpeg|png|webp)$/i, '') ?? url;

  useEffect(() => {
    if (!campanaId) return;

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/campana/${campanaId}/tokens`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            if (Array.isArray(payload)) {
              payload.forEach((move) => applyTokenMove(move));
            } else {
              applyTokenMove(payload as TokenMovePayload);
            }
          } catch (e) {
            console.error('Error parseando tokens:', e);
          }
        });

        client.subscribe(`/topic/campana/${campanaId}/token-sync`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            if (Array.isArray(payload)) {
              payload.forEach((move) => applyTokenMove(move));
            }
          } catch (e) {
            console.error('Error sincronizando tokens:', e);
          }
        });

        client.subscribe(`/topic/campana/${campanaId}/token-delete`, (frame) => {
          try {
            const payload = JSON.parse(frame.body) as TokenDeletePayload;
            applyTokenDelete(payload);
          } catch (e) {
            console.error('Error borrando token:', e);
          }
        });

        if (!syncRequestedRef.current) {
          syncRequestedRef.current = true;
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          client.publish({
            destination: `/app/campana/${campanaId}/token-request-sync`,
            body: JSON.stringify({ sessionId }),
          });
        }
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
      syncRequestedRef.current = false;
    };
  }, [campanaId, mapaActualUrl]);

  useEffect(() => {
    if (!jugadoresCampaa || jugadoresCampaa.length === 0) return;
    setTokens(prev => {
      const existing = new Map(prev.map(t => [String(t.ownerId ?? t.id), t]));
      const nuevos: Token[] = [];
      jugadoresCampaa.forEach((j: any) => {
        const ownerId = j.id ?? j.usuarioId ?? j.personajeId ?? j.personaje?.id ?? null;
        if (ownerId === null || ownerId === undefined) return;
        const key = String(ownerId);
        if (existing.has(key)) return;
        const base = existing.get(key);
        if (base) return;
        nuevos.push({
          id: `player-${key}`,
          ownerId,
          x: TAMANYO_CELDA / 2 + (nuevos.length * TAMANYO_CELDA),
          y: TAMANYO_CELDA / 2 + (nuevos.length * TAMANYO_CELDA),
          color: COLORES_TOKEN.jugador,
          nombre: j.nombre || j.usuarioNombre || 'Jugador',
          tipo: 'jugador',
        });
      });
      return nuevos.length > 0 ? [...prev, ...nuevos] : prev;
    });
  }, [jugadoresCampaa, mapaActualUrl]);

  useEffect(() => {
    if (!currentPlayerId || esMaster) return;
    setTokens(prev => {
      const exists = prev.some(t => t.tipo === 'jugador' && String(t.ownerId) === String(currentPlayerId));
      if (exists) return prev;
      const token: Token = {
        id: `player-${currentPlayerId}`,
        ownerId: currentPlayerId,
        x: TAMANYO_CELDA / 2,
        y: TAMANYO_CELDA / 2,
        color: COLORES_TOKEN.jugador,
        nombre: jugadorActualConAvatar?.nombre || personaje?.nombre || 'Jugador',
        tipo: 'jugador',
      };
      return [...prev, token];
    });
  }, [currentPlayerId, esMaster, jugadorActualConAvatar?.nombre, personaje?.nombre]);

  useEffect(() => {
    if (!stompRef.current?.connected || !campanaId) return;
    tokens.forEach((token) => {
      if (token.tipo === 'jugador' && !esMaster && String(token.ownerId) !== String(currentPlayerId)) return;
      if (sentTokenIdsRef.current.has(token.id)) return;
      sentTokenIdsRef.current.add(token.id);
      publishTokenMove(token, token.x, token.y);
    });
  }, [tokens, campanaId, esMaster, currentPlayerId]);

  return (
    <div className="tb-page" ref={containerRef}>

      {/* PANEL MASTER */}
      {esMaster && (
        <div className={`tb-panel ${panelAbierto ? 'abierto' : ''}`}>
          <button className="tb-panel-toggle" onClick={() => setPanelAbierto(!panelAbierto)}>
            {panelAbierto ? '◀' : '▶'}
          </button>
          <div className="tb-panel-contenido">
            <h3 className="tb-panel-titulo">🗡 Tablero</h3>
            <p className="tb-campana-nombre">{campaaNombre}</p>

            <div className="tb-seccion">
              <span className="tb-seccion-label">Herramienta</span>
              <div className="tb-herramientas">
                <button className={`tb-tool-btn ${herramienta === 'mover'  ? 'active' : ''}`} onClick={() => setHerramienta('mover')}  title="Mover vista">🤚</button>
                <button className={`tb-tool-btn ${herramienta === 'token'  ? 'active' : ''}`} onClick={() => setHerramienta('token')}  title="Añadir token">⊕</button>
                <button className={`tb-tool-btn ${herramienta === 'borrar' ? 'active' : ''}`} onClick={() => setHerramienta('borrar')} title="Borrar token">🗑</button>
              </div>
            </div>

            {herramienta === 'token' && (
              <div className="tb-seccion">
                <span className="tb-seccion-label">Tipo de token</span>
                <div className="tb-tipos-token">
                  {(['jugador', 'enemigo', 'npc'] as const).map(tipo => (
                    <button
                      key={tipo}
                      className={`tb-tipo-btn ${tipoToken === tipo ? 'active' : ''}`}
                      style={{ '--color': COLORES_TOKEN[tipo] } as any}
                      onClick={() => setTipoToken(tipo)}
                    >
                      <span className="tb-tipo-dot" style={{ background: COLORES_TOKEN[tipo] }} />
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </button>
                  ))}
                </div>
                <input
                  className="tb-input"
                  placeholder="Nombre del token..."
                  value={tokenNombre}
                  onChange={e => setTokenNombre(e.target.value)}
                />
              </div>
            )}

            <div className="tb-seccion">
              <span className="tb-seccion-label">Vista</span>
              <button className={`tb-toggle-btn ${mostrarCuadricula ? 'active' : ''}`} onClick={() => setMostrarCuadricula(!mostrarCuadricula)}>
                {mostrarCuadricula ? '▦ Ocultar cuadrícula' : '▦ Mostrar cuadrícula'}
              </button>
              <button className="tb-toggle-btn" onClick={resetearVista}>⟳ Resetear zoom</button>
            </div>

            <div className="tb-seccion">
              <span className="tb-seccion-label">Tokens ({tokens.length})</span>
              <div className="tb-tokens-lista">
                {tokens.map(t => (
                  <div key={t.id} className="tb-token-item">
                    <span className="tb-token-dot" style={{ background: t.color }} />
                    <span className="tb-token-nombre">{t.nombre}</span>
                    <button className="tb-token-borrar" onClick={() => borrarToken(t.id, { forzar: true })}>✕</button>
                  </div>
                ))}
                {tokens.length === 0 && <p className="tb-vacio">Sin tokens</p>}
              </div>
            </div>

            <div className="tb-seccion">
              <span className="tb-seccion-label">Mapa actual</span>
              <div className="tb-mapa-actual">
                <img src={mapaActualUrl} alt="Mapa actual" className="tb-mapa-thumb" />
                <span className="tb-mapa-nombre-actual">{nombreMapa(mapaActualUrl)}</span>
              </div>
            </div>

            <div className="tb-seccion tb-seccion-mapas">
              <span className="tb-seccion-label">
                Mapas de la campaña{' '}
                {cargandoMapas && <span className="tb-cargando">⏳</span>}
              </span>
              {!cargandoMapas && mapasDisponibles.length === 0 && (
                <p className="tb-vacio">No hay mapas guardados en esta campaña</p>
              )}
              <div className="tb-mapas-lista">
                {mapasDisponibles.map((url, index) => (
                  <div
                    key={index}
                    className={`tb-mapa-item ${mapaActualUrl === url ? 'active' : ''}`}
                    onClick={() => setMapaActualUrl(url)}
                    title={nombreMapa(url)}
                  >
                    <img src={url} alt={`Mapa ${index + 1}`} className="tb-mapa-thumb" />
                    <span className="tb-mapa-nombre">{nombreMapa(url)}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="tb-btn-salir" onClick={() => navigate('/join')}>
              &#8592; Salir de Partida
            </button>
          </div>
        </div>
      )}

      {/* PANEL JUGADOR */}
      {!esMaster && personaje && (
        <div className="tb-panel abierto">
          <div className="tb-panel-contenido">

            {/* CABECERA */}
            <div className="tb-ficha-header">
              {avatarSrc
                ? (
                  <img
                    src={avatarSrc}
                    alt={personaje.nombre}
                    className="tb-ficha-avatar"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const cartaSrc = resolveCartaUrl(personaje?.avatar);
                      if (img.dataset.fallback === 'carta') {
                        img.src = '/images/avatar-login.png';
                        img.dataset.fallback = 'default';
                        return;
                      }
                      if (cartaSrc && img.src !== cartaSrc) {
                        img.src = cartaSrc;
                        img.dataset.fallback = 'carta';
                        return;
                      }
                      img.src = '/images/avatar-login.png';
                      img.dataset.fallback = 'default';
                    }}
                  />
                )
                : <div className="tb-ficha-avatar-placeholder">{personaje.nombre.charAt(0)}</div>
              }
              <div>
                <h3 className="tb-panel-titulo" style={{ fontSize: 13 }}>{personaje.nombre}</h3>
                <p className="tb-campana-nombre">{personaje.raza} · {personaje.clase}</p>
                <p className="tb-campana-nombre">Nivel {personaje.nivel}</p>
              </div>
            </div>

            {/* HP */}
            <div className="tb-seccion">
              <span className="tb-seccion-label">Puntos de Golpe</span>
              <div className="tb-ficha-hp">
                <div className="tb-jugador-hp-barra">
                  <div className="tb-jugador-hp-fill" style={{
                    width: `${(personaje.puntosGolpeActual / personaje.puntosGolpeMax) * 100}%`,
                    background: personaje.puntosGolpeActual / personaje.puntosGolpeMax > 0.5
                      ? '#2ecc71'
                      : personaje.puntosGolpeActual / personaje.puntosGolpeMax > 0.25
                      ? '#f39c12'
                      : '#e74c3c',
                  }} />
                </div>
                <span className="tb-ficha-hp-num">{personaje.puntosGolpeActual} / {personaje.puntosGolpeMax}</span>
              </div>
            </div>

            {/* CARACTERÍSTICAS */}
            <div className="tb-seccion">
              <span className="tb-seccion-label">Características</span>
              <div className="tb-ficha-stats">
                {[
                  { label: 'FUE', valor: personaje.fuerza },
                  { label: 'DES', valor: personaje.destreza },
                  { label: 'CON', valor: personaje.constitucion },
                  { label: 'INT', valor: personaje.inteligencia },
                  { label: 'SAB', valor: personaje.sabiduria },
                  { label: 'CAR', valor: personaje.carisma },
                ].map(({ label, valor }) => {
                  const mod = Math.floor((valor - 10) / 2);
                  return (
                    <div key={label} className="tb-ficha-stat">
                      <span className="tb-ficha-stat-label">{label}</span>
                      <span className="tb-ficha-stat-valor">{valor}</span>
                      <span className="tb-ficha-stat-mod">{mod >= 0 ? `+${mod}` : mod}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COMBATE */}
            <div className="tb-seccion">
              <span className="tb-seccion-label">Combate</span>
              <div className="tb-ficha-combate">
                <div className="tb-ficha-combate-item">
                  <span className="tb-seccion-label">CA</span>
                  <span className="tb-ficha-combate-valor">{personaje.claseArmadura}</span>
                </div>
                <div className="tb-ficha-combate-item">
                  <span className="tb-seccion-label">INIC</span>
                  <span className="tb-ficha-combate-valor">+{personaje.iniciativa}</span>
                </div>
                <div className="tb-ficha-combate-item">
                  <span className="tb-seccion-label">VEL</span>
                  <span className="tb-ficha-combate-valor">{personaje.velocidad}m</span>
                </div>
                <div className="tb-ficha-combate-item">
                  <span className="tb-seccion-label">COMP</span>
                  <span className="tb-ficha-combate-valor">+{personaje.bonificacionCompetencia}</span>
                </div>
              </div>
            </div>

            <button className="tb-btn-salir" onClick={() => navigate('/join')}>
              &#8592; Salir de Partida
            </button>
          </div>
        </div>
      )}

      {/* TABLERO KONVA */}
      <Stage
        ref={stageRef}
        width={dimensiones.ancho}
        height={dimensiones.alto}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={herramienta === 'mover' && !draggingRef.current}
        onDragEnd={e => {
          if (e.target === e.target.getStage()) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
      >
        <Layer>
          <MapaFondo src={mapaActualUrl} ancho={MAPA_ANCHO} alto={MAPA_ALTO} />
          {mostrarCuadricula && <Cuadricula ancho={MAPA_ANCHO} alto={MAPA_ALTO} celda={TAMANYO_CELDA} />}

          {overlayCells.map(({ x, y, step }) => (
            <Group key={`ov-${x}-${y}`} x={x - TAMANYO_CELDA/2} y={y - TAMANYO_CELDA/2} listening={false}>
              <Rect width={TAMANYO_CELDA} height={TAMANYO_CELDA} fill="rgba(255, 204, 0, 0.45)" stroke="rgba(255, 220, 120, 0.9)" strokeWidth={1.5} />
              <Text text={step.toString()} width={TAMANYO_CELDA} height={TAMANYO_CELDA} align="center" verticalAlign="middle" fontStyle="bold" fontSize={18} fill="#ffffff" shadowColor="rgba(0,0,0,0.85)" shadowBlur={4} />
            </Group>
          ))}

          {tokens.map(token => {
            const isDragging = draggingRef.current?.tokenId === token.id && dragCurrent;
            const renderX = isDragging ? dragCurrent.x : token.x;
            const renderY = isDragging ? dragCurrent.y : token.y;
            return (
              <Group
                key={token.id}
                x={renderX}
                y={renderY}
                draggable={false}
                onPointerDown={e => {
                  if (herramienta !== 'mover') return;
                  if (!canMoverToken(token)) return;
                  e.cancelBubble = true;
                  if (!animatingTokenId) {
                    const origin = { x: token.x, y: token.y };
                    setDragOrigin(origin);
                    setDragCurrent(origin);
                    draggingRef.current = { tokenId: token.id, origin, current: origin };
                  }
                }}
                onClick={() => borrarToken(token.id)}
                onMouseEnter={e => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = herramienta === 'borrar' ? 'not-allowed' : 'grab';
                }}
                onMouseLeave={e => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = herramienta === 'mover' ? 'grab' : 'crosshair';
                }}
              >
                <Circle radius={22} fill="rgba(0,0,0,0.3)" offsetY={-4} />
                <Circle radius={20} fill={token.color} stroke="white" strokeWidth={2} shadowColor="rgba(0,0,0,0.5)" shadowBlur={6} shadowOffsetY={2} />
                <Text text={token.nombre.charAt(0).toUpperCase()} fontSize={16} fontStyle="bold" fill="white" align="center" verticalAlign="middle" width={40} height={40} offsetX={20} offsetY={20} />
                <Text text={token.nombre} fontSize={10} fill="white" align="center" width={60} offsetX={30} offsetY={-26} shadowColor="black" shadowBlur={4} />
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* INSTRUCCIONES */}
      <div className="tb-instrucciones">
        <span>🖱 Rueda: zoom</span>
        <span>🤚 Arrastrar: mover vista</span>
        {herramienta === 'token'  && <span>⊕ Clic en el mapa: añadir token</span>}
        {herramienta === 'borrar' && <span>🗑 Clic en token: borrar</span>}
      </div>

      <PanelPartida
        nombreMaster="Tú (Master)"
        jugadores={jugadoresCampaa}
        campanaId={campanaId}
        jugadorActual={jugadorActualConAvatar}
        esMaster={esMaster}
      />
    </div>
  );
}
