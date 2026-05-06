import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image, Line, Circle, Text, Group, Rect } from 'react-konva';
import { PanelPartida } from './PanelPartida';
import { obtenerCampanaPorId } from '../../services/campanaService';
import useImage from 'use-image';
import './Tablero.css';

// ── TIPOS ─────────────────────────────────────────────────
interface Token {
  id: string;
  x: number;
  y: number;
  color: string;
  nombre: string;
  tipo: 'jugador' | 'enemigo' | 'npc';
}

const COLORES_TOKEN = {
  jugador: '#4a90d9',
  enemigo: '#e74c3c',
  npc:     '#2ecc71',
};

const TAMANYO_CELDA = 50;
const MAPA_ANCHO    = 2400;
const MAPA_ALTO     = 1600;

// ── MAPA DE FONDO ─────────────────────────────────────────
function MapaFondo({ src, ancho, alto }: { src: string; ancho: number; alto: number }) {
  const [image] = useImage(src);
  return <Image image={image} x={0} y={0} width={ancho} height={alto} />;
}

// ── CUADRÍCULA ────────────────────────────────────────────
function Cuadricula({ ancho, alto, celda }: { ancho: number; alto: number; celda: number }) {
  const lineas = [];
  for (let x = 0; x <= ancho; x += celda)
    lineas.push(<Line key={`v${x}`} points={[x, 0, x, alto]} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />);
  for (let y = 0; y <= alto; y += celda)
    lineas.push(<Line key={`h${y}`} points={[0, y, ancho, y]} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />);
  return <>{lineas}</>;
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function Tablero() {
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapaUrl         = (location.state as any)?.mapaUrl        ?? '/images/mapas/bosque/caminoForestal.jpg';
  const campaaNombre    = (location.state as any)?.campaaNombre   ?? 'Campaña';
  const campanaId       = (location.state as any)?.campanaId;
  const jugadorActual   = (location.state as any)?.jugadorActual;
  const jugadoresCampaa = (location.state as any)?.jugadores      ?? [];

  const [mapaActualUrl, setMapaActualUrl]       = useState<string>(mapaUrl);
  const [mapasDisponibles, setMapasDisponibles] = useState<string[]>([]);
  const [cargandoMapas, setCargandoMapas]       = useState(false);

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

  // --- NUEVA LÓGICA DE MOVIMIENTO INTERACTIVO ---
  const snapToGrid = (val: number) => Math.round(val / TAMANYO_CELDA) * TAMANYO_CELDA + TAMANYO_CELDA / 2;
  const snapToCorner = (val: number) => Math.round(val / TAMANYO_CELDA) * TAMANYO_CELDA;

  const [animatingTokenId, setAnimatingTokenId] = useState<string | null>(null);
  const [animPath, setAnimPath] = useState<{x: number, y: number}[]>([]);
  const [animStep, setAnimStep] = useState(0);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dragOrigin, setDragOrigin] = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);
  const draggingRef = useRef<{ tokenId: string; origin: {x:number,y:number}; current: {x:number,y:number} } | null>(null);

  useEffect(() => {
    return () => { if (animTimerRef.current) clearTimeout(animTimerRef.current); };
  }, []);

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
  // ── FETCH DE MAPAS DESDE EL BACKEND ──────────────────────
  // Llama al endpoint de Spring Boot al montar el componente.
  // El backend debe devolver: ["ruta1.jpg", "ruta2.jpg", ...]
  // Ajusta la URL si tu endpoint es distinto.
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


  // Ajustar tamaño al resize
  useEffect(() => {
    const handleResize = () =>
        setDimensiones({ ancho: window.innerWidth - 300, alto: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom con rueda
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

  // Click en el stage para añadir token
  const handleStageClick = (e: any) => {
    if (herramienta !== 'token') return;
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
    };
    setTokens(prev => [...prev, nuevo]);
  };

  const moverToken = (id: string, x: number, y: number) =>
      setTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));

  const borrarToken = (id: string) => {
    if (herramienta === 'borrar')
      setTokens(prev => prev.filter(t => t.id !== id));
  };

  const resetearVista = () => {
    setScale(calcularScaleInicial());
    setPosition({ x: 0, y: 0 });
  };

  const nombreMapa = (url: string) =>
      url.split('/').pop()?.replace(/\.(jpg|jpeg|png|webp)$/i, '') ?? url;

  return (
      <div className="tb-page" ref={containerRef}>

        {/* PANEL DE HERRAMIENTAS */}
        <div className={`tb-panel ${panelAbierto ? 'abierto' : ''}`}>
          <button className="tb-panel-toggle" onClick={() => setPanelAbierto(!panelAbierto)}>
            {panelAbierto ? '◀' : '▶'}
          </button>

          <div className="tb-panel-contenido">
            <h3 className="tb-panel-titulo">🗡 Tablero</h3>
            <p className="tb-campana-nombre">{campaaNombre}</p>

            {/* HERRAMIENTAS */}
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

            {/* VISTA */}
            <div className="tb-seccion">
              <span className="tb-seccion-label">Vista</span>
              <button className={`tb-toggle-btn ${mostrarCuadricula ? 'active' : ''}`} onClick={() => setMostrarCuadricula(!mostrarCuadricula)}>
                {mostrarCuadricula ? '▦ Ocultar cuadrícula' : '▦ Mostrar cuadrícula'}
              </button>
              <button className="tb-toggle-btn" onClick={resetearVista}>⟳ Resetear zoom</button>
            </div>

            {/* TOKENS */}
            <div className="tb-seccion">
              <span className="tb-seccion-label">Tokens ({tokens.length})</span>
              <div className="tb-tokens-lista">
                {tokens.map(t => (
                    <div key={t.id} className="tb-token-item">
                      <span className="tb-token-dot" style={{ background: t.color }} />
                      <span className="tb-token-nombre">{t.nombre}</span>
                      <button className="tb-token-borrar" onClick={() => setTokens(prev => prev.filter(x => x.id !== t.id))}>✕</button>
                    </div>
                ))}
                {tokens.length === 0 && <p className="tb-vacio">Sin tokens</p>}
              </div>
            </div>

            {/* MAPA ACTUAL */}
            <div className="tb-seccion">
              <span className="tb-seccion-label">Mapa actual</span>
              <div className="tb-mapa-actual">
                <img src={mapaActualUrl} alt="Mapa actual" className="tb-mapa-thumb" />
                <span className="tb-mapa-nombre-actual">{nombreMapa(mapaActualUrl)}</span>
              </div>
            </div>

            {/* ── MAPAS DE LA CAMPAÑA (cargados desde el backend) ── */}
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

            {/* OVERLAY DE MOVIMIENTO */}
            {overlayCells.map(({ x, y, step }) => (
                <Group key={`ov-${x}-${y}`} x={x - TAMANYO_CELDA/2} y={y - TAMANYO_CELDA/2} listening={false}>
                  <Rect width={TAMANYO_CELDA} height={TAMANYO_CELDA} fill="rgba(255, 204, 0, 0.45)" stroke="rgba(255, 220, 120, 0.9)" strokeWidth={1.5} />
                  <Text text={step.toString()} width={TAMANYO_CELDA} height={TAMANYO_CELDA} align="center" verticalAlign="middle" fontStyle="bold" fontSize={18} fill="#ffffff" shadowColor="rgba(0,0,0,0.85)" shadowBlur={4} />
                </Group>
            ))}

            {tokens.map(token => {
                const isActiveAnim = animatingTokenId === token.id;
                // si el token se está arrastrando en este instante o si usa estado de animación,
                // su x e y cambian a través del render de estado origin/current
                // wait, if we use dragCurrent correctly, we should render the dragged token at current
                // actually, during dragging 'moverToken' is NOT called until path is established.
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
            jugadorActual={jugadorActual}
        />
      </div>
  );
}


