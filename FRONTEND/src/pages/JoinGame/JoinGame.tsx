import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JoinGame.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { useNavigate } from 'react-router-dom';

// ── TIPOS ─────────────────────────────────────────────────
interface Jugador {
  id: number;
  nombre: string;
  avatar?: string;
}

interface Campana {
  id: number;
  nombre: string;
  descripcion: string;
  historia: string;
  portada?: string;
  master: string;
  jugadores: Jugador[];
  maxJugadores: number;
  sesiones: number;
  sistema: string;
  dificultad: 'Fácil' | 'Media' | 'Difícil' | 'Épica';
  estado: 'Abierta' | 'En curso' | 'Completa';
  nivelMinimo: number;
}

interface Mision {
  id: number;
  nombre: string;
  imagen?: string;
  descripcion: string;
  tipo: 'Mazmorra' | 'Escolta' | 'Exploración' | 'Caza' | 'Rescate' | 'Defensa';
  dificultad: 'Fácil' | 'Media' | 'Difícil' | 'Épica';
  recompensa: string;
  nivelMinimo: number;
  jugadoresMax: number;
  duracion: string;
  completada: boolean;
}

// ── DATOS CAMPAÑAS ────────────────────────────────────────
const CAMPANAS_MOCK: Campana[] = [
  {
    id: 1,
    nombre: 'La Maldición del Dragón Esmeralda',
    descripcion: 'Una antigua maldición despierta en las ruinas de Khel\'thar. Buscamos valientes aventureros para detener al dragón antes de que arrase las tierras del norte.',
    historia: 'Hace mil años, el dragón Verthax fue sellado bajo las montañas de Khel\'thar por un grupo de héroes. Ahora el sello se debilita y necesitamos nuevos héroes que completen el ritual antes del solsticio de invierno.',
    portada: undefined,
    master: 'DungeonLord42',
    jugadores: [{ id: 1, nombre: 'Elara' }, { id: 2, nombre: 'Thorin' }],
    maxJugadores: 5, sesiones: 8, sistema: 'D&D 5e',
    dificultad: 'Difícil', estado: 'Abierta', nivelMinimo: 3,
  },
  {
    id: 2,
    nombre: 'Los Secretos de Mirkwood',
    descripcion: 'Un viaje a través del bosque encantado donde los árboles guardan secretos milenarios y las sombras ocultan criaturas desconocidas.',
    historia: 'El Bosque de Mirkwood ha sido corrompido por una oscuridad sin nombre. Los elfos piden ayuda a los aventureros para purificar el corazón del bosque antes de que la corrupción se extienda.',
    portada: undefined,
    master: 'MasterElfo',
    jugadores: [{ id: 3, nombre: 'Zara' }],
    maxJugadores: 4, sesiones: 5, sistema: 'D&D 5e',
    dificultad: 'Media', estado: 'Abierta', nivelMinimo: 1,
  },
  {
    id: 3,
    nombre: 'El Dungeon Olvidado',
    descripcion: 'Una mazmorra sin explorar bajo la ciudad de Waterdeep esconde tesoros inimaginables... y peligros mortales.',
    historia: 'Un anciano cartógrafo encontró mapas de una mazmorra desconocida bajo la ciudad. Nadie que haya entrado ha vuelto, pero las riquezas prometidas son demasiado tentadoras para ignorarlas.',
    portada: undefined,
    master: 'DarkMaster',
    jugadores: [{ id: 4, nombre: 'Gandor' }, { id: 5, nombre: 'Lyra' }, { id: 6, nombre: 'Thork' }],
    maxJugadores: 4, sesiones: 12, sistema: 'D&D 5e',
    dificultad: 'Épica', estado: 'Abierta', nivelMinimo: 5,
  },
  {
    id: 4,
    nombre: 'Inicio del Aventurero',
    descripcion: 'Campaña perfecta para nuevos jugadores. Una historia de introducción al mundo del rol.',
    historia: 'Un pequeño pueblo necesita ayuda. Monstruos están atacando los campos y el alcalde no sabe qué hacer.',
    portada: undefined,
    master: 'GuíaRol',
    jugadores: [],
    maxJugadores: 6, sesiones: 3, sistema: 'D&D 5e',
    dificultad: 'Fácil', estado: 'Abierta', nivelMinimo: 1,
  },
  {
    id: 5,
    nombre: 'La Torre del Hechicero Loco',
    descripcion: 'Un hechicero excéntrico ha lanzado un hechizo que está afectando a toda la región.',
    historia: 'El hechicero Malachar lleva semanas encerrado en su torre haciendo experimentos fallidos.',
    portada: undefined,
    master: 'WizardPro',
    jugadores: [{ id: 7, nombre: 'Rolo' }],
    maxJugadores: 4, sesiones: 4, sistema: 'D&D 5e',
    dificultad: 'Media', estado: 'Abierta', nivelMinimo: 2,
  },
  {
    id: 6,
    nombre: 'Piratas del Mar de las Espadas',
    descripcion: 'Aventuras en alta mar, tesoros piratas y ciudades flotantes.',
    historia: 'Una flota pirata lleva meses saqueando los puertos del Mar de las Espadas.',
    portada: undefined,
    master: 'SeaCaptain',
    jugadores: [{ id: 8, nombre: 'Marina' }, { id: 9, nombre: 'Corsario' }],
    maxJugadores: 5, sesiones: 10, sistema: 'D&D 5e',
    dificultad: 'Difícil', estado: 'Abierta', nivelMinimo: 4,
  },
];

// ── DATOS MISIONES ────────────────────────────────────────
const MISIONES_MOCK: Mision[] = [
      {
    id: 1,
    nombre: 'El Primer Sello',
    descripcion: 'Destruye el primer sello de la maldición.',
    tipo: 'Mazmorra',
    dificultad: 'Fácil',
    recompensa: '200 XP',
    nivelMinimo: 1,
    jugadoresMax: 4,
    duracion: '1-2 horas',
    completada: false,
  },
  {
    id: 2,
    nombre: 'La Guarida del Orco',
    descripcion: 'Elimina al jefe orco del campamento.',
    tipo: 'Caza',
    dificultad: 'Media',
    recompensa: '450 XP',
    nivelMinimo: 2,
    jugadoresMax: 4,
    duracion: '2-3 horas',
    completada: false,
  },
  {
    id: 3,
    nombre: 'El Dragón Despierta',
    descripcion: 'Confronta al dragón en su cueva.',
    tipo: 'Caza',
    dificultad: 'Épica',
    recompensa: '2000 XP',
    nivelMinimo: 6,
    jugadoresMax: 5,
    duracion: '5-6 horas',
    completada: false,
  },
  {
    id: 4,
    nombre: 'Tutorial: Primer Combate',
    descripcion: 'Aprende las mecánicas básicas.',
    tipo: 'Exploración',
    dificultad: 'Fácil',
    recompensa: '100 XP',
    nivelMinimo: 1,
    jugadoresMax: 6,
    duracion: '30 min',
    completada: false,
  },
  {
    id: 5,
    nombre: 'Rastros en el Pueblo',
    descripcion: 'Investiga las desapariciones en la aldea. Los aldeanos hablan de sombras que se mueven de noche.',
    tipo: 'Exploración',
    dificultad: 'Fácil',
    recompensa: '100 XP',
    nivelMinimo: 1,
    jugadoresMax: 4,
    duracion: '1-2 horas',
    completada: false,
  },
  {
    id: 6,
    nombre: 'El Bosque Maldito',
    descripcion: 'Cruzad el bosque que rodea Barovia. Los lobos sombríos merodean entre los árboles.',
    tipo: 'Exploración',
    dificultad: 'Fácil',
    recompensa: '150 XP',
    nivelMinimo: 1,
    jugadoresMax: 4,
    duracion: '1-2 horas',
    completada: false,
  },
  {
    id: 7,
    nombre: 'Las Puertas del Castillo',
    descripcion: 'Alcanzad las puertas del Castillo Ravenloft y enfrentad a los primeros guardias vampíricos.',
    tipo: 'Defensa',
    dificultad: 'Media',
    recompensa: '200 XP',
    nivelMinimo: 2,
    jugadoresMax: 4,
    duracion: '2-3 horas',
    completada: false,
  },
  {
    id: 8,
    nombre: 'Señales en la Ciudad',
    descripcion: 'Símbolos extraños aparecen en los muros de Vallaki. Alguien prepara un ritual en las sombras.',
    tipo: 'Exploración',
    dificultad: 'Fácil',
    recompensa: '200 XP',
    nivelMinimo: 1,
    jugadoresMax: 4,
    duracion: '1-2 horas',
    completada: false,
  },
  {
    id: 9,
    nombre: 'Las Catacumbas',
    descripcion: 'Descended a las catacumbas bajo la ciudad. El culto celebra sus rituales en la oscuridad total.',
    tipo: 'Mazmorra',
    dificultad: 'Media',
    recompensa: '300 XP',
    nivelMinimo: 2,
    jugadoresMax: 4,
    duracion: '2-3 horas',
    completada: false,
  },
  {
    id: 10,
    nombre: 'El Altar de la Luna',
    descripcion: 'Interrumpid el ritual antes de que la Luna Roja alcance su cenit y despierte al antiguo mal.',
    tipo: 'Defensa',
    dificultad: 'Difícil',
    recompensa: '500 XP',
    nivelMinimo: 3,
    jugadoresMax: 5,
    duracion: '3-4 horas',
    completada: false,
  },
  {
    id: 11,
    nombre: 'El Ejército Avanza',
    descripcion: 'El ejército de no-muertos marcha hacia las tierras de los vivos. Hay que frenarlo en campo abierto.',
    tipo: 'Defensa',
    dificultad: 'Difícil',
    recompensa: '400 XP',
    nivelMinimo: 3,
    jugadoresMax: 6,
    duracion: '3-4 horas',
    completada: false,
  },
  {
    id: 12,
    nombre: 'La Fortaleza Maldita',
    descripcion: 'Infiltraos en la fortaleza donde Azalin Rex prepara el ritual definitivo.',
    tipo: 'Rescate',
    dificultad: 'Difícil',
    recompensa: '600 XP',
    nivelMinimo: 4,
    jugadoresMax: 5,
    duracion: '4-5 horas',
    completada: false,
  },
  {
    id: 13,
    nombre: 'El Trono de los Muertos',
    descripcion: 'Enfrentad al Archlich Azalin Rex en su sala del trono antes de que complete el ritual eterno.',
    tipo: 'Mazmorra',
    dificultad: 'Épica',
    recompensa: '1000 XP',
    nivelMinimo: 5,
    jugadoresMax: 5,
    duracion: '5-6 horas',
    completada: false,
  },
];

const DIFICULTAD_COLOR: Record<string, string> = {
  'Fácil':   '#2ecc71',
  'Media':   '#f39c12',
  'Difícil': '#e74c3c',
  'Épica':   '#9b59b6',
};

const TIPO_ICONO: Record<string, string> = {
  'Mazmorra':    '🏚',
  'Escolta':     '🛡',
  'Exploración': '🗺',
  'Caza':        '🗡',
  'Rescate':     '⚔',
  'Defensa':     '🏰',
};

// ── MODAL CAMPAÑA ─────────────────────────────────────────
function ModalCampana({ campana, onClose }: { campana: Campana; onClose: () => void }) {
  const plazasLibres = campana.maxJugadores - campana.jugadores.length;
  const navigate = useNavigate();

  return (
    <div className="jg-modal-overlay" onClick={onClose}>
      <div className="jg-modal" onClick={e => e.stopPropagation()}>
        <div className="jg-modal-hero">
          {campana.portada
            ? <img src={campana.portada} alt={campana.nombre} className="jg-modal-hero-img" />
            : <div className="jg-modal-hero-placeholder" />
          }
          <div className="jg-modal-hero-overlay" />
          <button className="jg-modal-close" onClick={onClose}>✕</button>
          <div className="jg-modal-hero-info">
            <span className="jg-dificultad-badge" style={{ background: DIFICULTAD_COLOR[campana.dificultad] }}>
              {campana.dificultad}
            </span>
            <h2 className="jg-modal-titulo">{campana.nombre}</h2>
            <p className="jg-modal-sistema">{campana.sistema} · Nivel mín. {campana.nivelMinimo}</p>
          </div>
        </div>
        <div className="jg-modal-body">
          <div className="jg-modal-stats">
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Master</span>
              <span className="jg-modal-stat-valor">⚔ {campana.master}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Sesiones</span>
              <span className="jg-modal-stat-valor">📅 {campana.sesiones}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Plazas libres</span>
              <span className="jg-modal-stat-valor">👥 {plazasLibres} / {campana.maxJugadores}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Estado</span>
              <span className="jg-modal-stat-valor jg-estado-abierta">{campana.estado}</span>
            </div>
          </div>
          <div className="jg-modal-seccion">
            <h4 className="jg-modal-seccion-titulo">Historia de la Campaña</h4>
            <p className="jg-modal-texto">{campana.historia}</p>
          </div>
          <div className="jg-modal-seccion">
            <h4 className="jg-modal-seccion-titulo">Aventureros en la partida</h4>
            {campana.jugadores.length === 0 ? (
              <p className="jg-modal-texto" style={{ opacity: 0.5 }}>Sé el primero en unirte</p>
            ) : (
              <div className="jg-jugadores-lista">
                {campana.jugadores.map(j => (
                  <div key={j.id} className="jg-jugador-chip">
                    <div className="jg-jugador-avatar">{j.nombre.charAt(0).toUpperCase()}</div>
                    <span>{j.nombre}</span>
                  </div>
                ))}
                {Array.from({ length: plazasLibres }).map((_, i) => (
                  <div key={`libre-${i}`} className="jg-jugador-chip jg-jugador-libre">
                    <div className="jg-jugador-avatar jg-jugador-avatar-libre">+</div>
                    <span>Plaza libre</span>
                  </div>
                ))}
              </div>
            )}
          </div>
              <button 
                className="jg-btn-unirse" 
                disabled={plazasLibres === 0}
                onClick={() => navigate('/tablero', { 
                  state: { 
                    campañaNombre: campana.nombre,
                    mapaUrl: '/images/mapas/bosque/caminoForestal.jpg'
                  } 
                })}
              >
                {plazasLibres > 0 ? '⚔ Unirme a esta Campaña' : 'Campaña Completa'}
              </button>
          
        </div>
      </div>
    </div>
  );
}

// ── MODAL MISIÓN ──────────────────────────────────────────
function ModalMision({ mision, onClose }: { mision: Mision; onClose: () => void }) {
  return (
    <div className="jg-modal-overlay" onClick={onClose}>
      <div className="jg-modal" onClick={e => e.stopPropagation()}>
        <div className="jg-modal-hero" style={{ background: 'rgba(20,6,8,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '80px', opacity: 0.4 }}>{TIPO_ICONO[mision.tipo]}</div>
          <div className="jg-modal-hero-overlay" />
          <button className="jg-modal-close" onClick={onClose}>✕</button>
          <div className="jg-modal-hero-info">
            <span className="jg-dificultad-badge" style={{ background: DIFICULTAD_COLOR[mision.dificultad] }}>
              {mision.dificultad}
            </span>
            <h2 className="jg-modal-titulo">{mision.nombre}</h2>
            <p className="jg-modal-sistema">{mision.tipo} · Nivel mín. {mision.nivelMinimo}</p>
          </div>
        </div>
        <div className="jg-modal-body">
          <div className="jg-modal-stats">
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Recompensa</span>
              <span className="jg-modal-stat-valor">💰 {mision.recompensa}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Duración</span>
              <span className="jg-modal-stat-valor">⏱ {mision.duracion}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Jugadores</span>
              <span className="jg-modal-stat-valor">👥 Máx. {mision.jugadoresMax}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Tipo</span>
              <span className="jg-modal-stat-valor">{TIPO_ICONO[mision.tipo]} {mision.tipo}</span>
            </div>
          </div>
          <div className="jg-modal-seccion">
            <h4 className="jg-modal-seccion-titulo">Descripción de la Misión</h4>
            <p className="jg-modal-texto">{mision.descripcion}</p>
          </div>
          <button className="jg-btn-unirse">
            ⚔ Aceptar Misión
          </button>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function JoinGame() {
  const [tab, setTab] = useState<'campanas' | 'misiones'>('campanas');
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [misionSeleccionada, setMisionSeleccionada] = useState<Mision | null>(null);
  const [filtro, setFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');

  const campanasFiltradas = CAMPANAS_MOCK.filter(c => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.master.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || c.dificultad.toLowerCase() === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  const misionesFiltradas = MISIONES_MOCK.filter(m => {
    const coincideBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || m.dificultad.toLowerCase() === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  return (
    <div className="jg-page">
      <div className="jg-bg" />
      <BackButton />

      <div className="jg-contenido">

        {/* CABECERA */}
        <div className="jg-header">
          <h1 className="jg-titulo">
            {tab === 'campanas' ? 'Únete a una Aventura' : 'Tablero de Misiones'}
          </h1>
          <p className="jg-subtitulo">
            {tab === 'campanas'
              ? 'Encuentra tu grupo y forja tu leyenda en RavenLoft Castle'
              : 'Acepta misiones, derrota enemigos y hazte con las recompensas'}
          </p>
        </div>

        {/* PESTAÑAS */}
        <div className="jg-pestanas">
          <button
            className={`jg-pestana ${tab === 'campanas' ? 'active' : ''}`}
            onClick={() => { setTab('campanas'); setFiltro('todas'); setBusqueda(''); }}
          >
            ⚔ Unirse a Partida
          </button>
          <button
            className={`jg-pestana ${tab === 'misiones' ? 'active' : ''}`}
            onClick={() => { setTab('misiones'); setFiltro('todas'); setBusqueda(''); }}
          >
            📜 Misiones
          </button>
        </div>

        {/* CONTROLES */}
        <div className="jg-controles">
          <div className="jg-busqueda-wrap">
            <span className="jg-busqueda-icon">🔍</span>
            <input
              className="jg-busqueda"
              placeholder={tab === 'campanas' ? 'Buscar campaña o master...' : 'Buscar misión...'}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="jg-filtros">
            {['todas', 'fácil', 'media', 'difícil', 'épica'].map(f => (
              <button
                key={f}
                className={`jg-filtro-btn ${filtro === f ? 'active' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── CAMPAÑAS ── */}
        {tab === 'campanas' && (
          <>
            <div className="jg-grid">
              {campanasFiltradas.map((campana, i) => {
                const plazasLibres = campana.maxJugadores - campana.jugadores.length;
                return (
                  <div
                    key={campana.id}
                    className="jg-card"
                    style={{ animationDelay: `${i * 0.08}s` }}
                    onClick={() => setCampanaSeleccionada(campana)}
                  >
                    <div className="jg-card-img-wrap">
                      {campana.portada
                        ? <img src={campana.portada} alt={campana.nombre} className="jg-card-img" />
                        : <div className="jg-card-img-placeholder">⚔</div>
                      }
                      <div className="jg-card-overlay" />
                      <span className="jg-card-dificultad" style={{ background: DIFICULTAD_COLOR[campana.dificultad] }}>
                        {campana.dificultad}
                      </span>
                      <span className="jg-card-sesiones">📅 {campana.sesiones} sesiones</span>
                    </div>
                    <div className="jg-card-info">
                      <h3 className="jg-card-nombre">{campana.nombre}</h3>
                      <p className="jg-card-desc">{campana.descripcion}</p>
                      <div className="jg-card-footer">
                        <span className="jg-card-master">⚔ {campana.master}</span>
                        <span className={`jg-card-plazas ${plazasLibres === 0 ? 'completa' : ''}`}>
                          👥 {plazasLibres > 0 ? `${plazasLibres} plazas` : 'Completa'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {campanasFiltradas.length === 0 && (
              <div className="jg-vacio">
                <div className="jg-vacio-icon">🗡</div>
                <p>No se encontraron campañas con esos criterios</p>
              </div>
            )}
          </>
        )}

        {/* ── MISIONES ── */}
        {tab === 'misiones' && (
          <>
            <div className="jg-misiones-grid">
              {misionesFiltradas.map((mision, i) => (
                <div
                  key={mision.id}
                  className="jg-mision-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => setMisionSeleccionada(mision)}
                >
                  {/* IMAGEN / ICONO */}
                  <div className="jg-mision-img-wrap">
                    {mision.imagen
                      ? <img src={mision.imagen} alt={mision.nombre} className="jg-mision-img" />
                      : <div className="jg-mision-icono">{TIPO_ICONO[mision.tipo]}</div>
                    }
                    <div className="jg-mision-overlay" />
                    <span className="jg-mision-tipo-badge">{mision.tipo}</span>
                    <span className="jg-mision-dif-badge" style={{ background: DIFICULTAD_COLOR[mision.dificultad] }}>
                      {mision.dificultad}
                    </span>
                  </div>

                  {/* INFO */}
                  <div className="jg-mision-info">
                    <h3 className="jg-mision-nombre">{mision.nombre}</h3>
                    <p className="jg-mision-desc">{mision.descripcion}</p>
                    <div className="jg-mision-footer">
                      <span className="jg-mision-recompensa">💰 {mision.recompensa}</span>
                      <span className="jg-mision-nivel">Nv. {mision.nivelMinimo}+</span>
                    </div>
                    <div className="jg-mision-meta">
                      <span>⏱ {mision.duracion}</span>
                      <span>👥 Máx. {mision.jugadoresMax}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {misionesFiltradas.length === 0 && (
              <div className="jg-vacio">
                <div className="jg-vacio-icon">📜</div>
                <p>No se encontraron misiones con esos criterios</p>
              </div>
            )}
          </>
        )}

      </div>

      {/* MODALES */}
      {campanaSeleccionada && (
        <ModalCampana campana={campanaSeleccionada} onClose={() => setCampanaSeleccionada(null)} />
      )}
      {misionSeleccionada && (
        <ModalMision mision={misionSeleccionada} onClose={() => setMisionSeleccionada(null)} />
      )}

    </div>
  );
}