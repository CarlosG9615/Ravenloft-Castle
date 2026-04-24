import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image, Line, Circle, Text, Group } from 'react-konva';
import { PanelPartida } from './PanelPartida';
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

// ── MAPA DE FONDO ─────────────────────────────────────────
function MapaFondo({ src }: { src: string }) {
  const [image] = useImage(src);
  return <Image image={image} x={0} y={0} />;
}

// ── CUADRÍCULA ────────────────────────────────────────────
function Cuadricula({ ancho, alto, celda }: { ancho: number; alto: number; celda: number }) {
  const lineas = [];

  for (let x = 0; x <= ancho; x += celda) {
    lineas.push(
      <Line key={`v${x}`} points={[x, 0, x, alto]}
        stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
    );
  }

  for (let y = 0; y <= alto; y += celda) {
    lineas.push(
      <Line key={`h${y}`} points={[0, y, ancho, y]}
        stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
    );
  }

  return <>{lineas}</>;
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function Tablero() {
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapaUrl = (location.state as any)?.mapaUrl ?? '/images/mapas/bosque/caminoForestal.jpg';
  const campañaNombre = (location.state as any)?.campañaNombre ?? 'Campaña';

  const [dimensiones, setDimensiones] = useState({ ancho: window.innerWidth - 300, alto: window.innerHeight });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tokens, setTokens] = useState<Token[]>([
    { id: '1', x: 100, y: 100, color: COLORES_TOKEN.jugador, nombre: 'P1', tipo: 'jugador' },
    { id: '2', x: 200, y: 150, color: COLORES_TOKEN.jugador, nombre: 'P2', tipo: 'jugador' },
  ]);
  const [herramienta, setHerramienta] = useState<'mover' | 'token' | 'borrar'>('mover');
  const [tipoToken, setTipoToken] = useState<'jugador' | 'enemigo' | 'npc'>('jugador');
  const [tokenNombre, setTokenNombre] = useState('');
  const [mostrarCuadricula, setMostrarCuadricula] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState(true);

  // Ajustar tamaño al resize
  useEffect(() => {
    const handleResize = () => {
      setDimensiones({ ancho: window.innerWidth -300, alto: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom con rueda
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * 1.1, 4)
      : Math.max(oldScale / 1.1, 0.3);
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

    const stage = stageRef.current;
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

  const moverToken = (id: string, x: number, y: number) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  };

  const borrarToken = (id: string) => {
    if (herramienta === 'borrar') {
      setTokens(prev => prev.filter(t => t.id !== id));
    }
  };

  const snapToGrid = (val: number) =>
    Math.round(val / TAMANYO_CELDA) * TAMANYO_CELDA + TAMANYO_CELDA / 2;

  return (
    <div className="tb-page" ref={containerRef}>

      {/* PANEL DE HERRAMIENTAS */}
      <div className={`tb-panel ${panelAbierto ? 'abierto' : ''}`}>
        <button className="tb-panel-toggle" onClick={() => setPanelAbierto(!panelAbierto)}>
          {panelAbierto ? '◀' : '▶'}
        </button>

        <div className="tb-panel-contenido">
          <h3 className="tb-panel-titulo">🗡 Tablero</h3>
          <p className="tb-campana-nombre">{campañaNombre}</p>

          <div className="tb-seccion">
            <span className="tb-seccion-label">Herramienta</span>
            <div className="tb-herramientas">
              <button
                className={`tb-tool-btn ${herramienta === 'mover' ? 'active' : ''}`}
                onClick={() => setHerramienta('mover')}
                title="Mover vista"
              >🤚</button>
              <button
                className={`tb-tool-btn ${herramienta === 'token' ? 'active' : ''}`}
                onClick={() => setHerramienta('token')}
                title="Añadir token"
              >⊕</button>
              <button
                className={`tb-tool-btn ${herramienta === 'borrar' ? 'active' : ''}`}
                onClick={() => setHerramienta('borrar')}
                title="Borrar token"
              >🗑</button>
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
            <button
              className={`tb-toggle-btn ${mostrarCuadricula ? 'active' : ''}`}
              onClick={() => setMostrarCuadricula(!mostrarCuadricula)}
            >
              {mostrarCuadricula ? '▦ Ocultar cuadrícula' : '▦ Mostrar cuadrícula'}
            </button>
            <button
              className="tb-toggle-btn"
              onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
            >
              ⟳ Resetear zoom
            </button>
          </div>

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
              {tokens.length === 0 && (
                <p className="tb-vacio">Sin tokens</p>
              )}
            </div>
          </div>

          <button className="tb-btn-salir" onClick={() => navigate(-1)}>← Salir</button>
        </div>
      </div>

      {/* CANVAS */}
      <Stage
        ref={stageRef}
        width={dimensiones.ancho}
        height={dimensiones.alto}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        draggable={herramienta === 'mover'}
        onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
        className={`tb-stage ${herramienta === 'token' ? 'cursor-crosshair' : herramienta === 'borrar' ? 'cursor-eraser' : 'cursor-grab'}`}
      >
        {/* CAPA MAPA */}
        <Layer>
          <MapaFondo src={mapaUrl} />
        </Layer>

        {/* CAPA CUADRÍCULA */}
        {mostrarCuadricula && (
          <Layer>
            <Cuadricula ancho={3000} alto={3000} celda={TAMANYO_CELDA} />
          </Layer>
        )}

        {/* CAPA TOKENS */}
        <Layer>
          {tokens.map(token => (
            <Group
              key={token.id}
              x={token.x}
              y={token.y}
              draggable={herramienta === 'mover'}
              onDragEnd={e => moverToken(token.id, snapToGrid(e.target.x()), snapToGrid(e.target.y()))}
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
              {/* Sombra */}
              <Circle radius={22} fill="rgba(0,0,0,0.3)" offsetY={-4} />
              {/* Círculo principal */}
              <Circle
                radius={20}
                fill={token.color}
                stroke="white"
                strokeWidth={2}
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={6}
                shadowOffsetY={2}
              />
              {/* Inicial */}
              <Text
                text={token.nombre.charAt(0).toUpperCase()}
                fontSize={16}
                fontStyle="bold"
                fill="white"
                align="center"
                verticalAlign="middle"
                width={40}
                height={40}
                offsetX={20}
                offsetY={20}
              />
              {/* Nombre debajo */}
              <Text
                text={token.nombre}
                fontSize={10}
                fill="white"
                align="center"
                width={60}
                offsetX={30}
                offsetY={-26}
                shadowColor="black"
                shadowBlur={4}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* INSTRUCCIONES */}
      <div className="tb-instrucciones">

        <span>🖱 Rueda: zoom</span>
        <span>🤚 Arrastrar: mover vista</span>
        {herramienta === 'token' && <span>⊕ Clic en el mapa: añadir token</span>}
        {herramienta === 'borrar' && <span>🗑 Clic en token: borrar</span>}
      </div>
        <PanelPartida nombreMaster="Tú (Master)" />
    </div>
  );
}