import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JoinGame.css';
import { BackButton } from '../../components/BackButton/BackButton';

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

// ── DATOS DE PRUEBA ────────────────────────────────────────
const CAMPANAS_MOCK: Campana[] = [
  {
    id: 1,
    nombre: 'La Maldición del Dragón Esmeralda',
    descripcion: 'Una antigua maldición despierta en las ruinas de Khel\'thar. Buscamos valientes aventureros para detener al dragón antes de que arrase las tierras del norte.',
    historia: 'Hace mil años, el dragón Verthax fue sellado bajo las montañas de Khel\'thar por un grupo de héroes. Ahora el sello se debilita y necesitamos nuevos héroes que completen el ritual antes del solsticio de invierno.',
    portada: '/images/join-friends.png',
    master: 'DungeonLord42',
    jugadores: [
      { id: 1, nombre: 'Elara', avatar: undefined },
      { id: 2, nombre: 'Thorin', avatar: undefined },
    ],
    maxJugadores: 5,
    sesiones: 8,
    sistema: 'D&D 5e',
    dificultad: 'Difícil',
    estado: 'Abierta',
    nivelMinimo: 3,
  },
  {
    id: 2,
    nombre: 'Los Secretos de Mirkwood',
    descripcion: 'Un viaje a través del bosque encantado donde los árboles guardan secretos milenarios y las sombras ocultan criaturas desconocidas.',
    historia: 'El Bosque de Mirkwood ha sido corrompido por una oscuridad sin nombre. Los elfos piden ayuda a los aventureros para purificar el corazón del bosque antes de que la corrupción se extienda.',
    portada: '/images/join-friends.png',
    master: 'MasterElfo',
    jugadores: [
      { id: 3, nombre: 'Zara', avatar: undefined },
    ],
    maxJugadores: 4,
    sesiones: 5,
    sistema: 'D&D 5e',
    dificultad: 'Media',
    estado: 'Abierta',
    nivelMinimo: 1,
  },
  {
    id: 3,
    nombre: 'El Dungeon Olvidado',
    descripcion: 'Una mazmorra sin explorar bajo la ciudad de Waterdeep esconde tesoros inimaginables... y peligros mortales.',
    historia: 'Un anciano cartógrafo encontró mapas de una mazmorra desconocida bajo la ciudad. Nadie que haya entrado ha vuelto, pero las riquezas prometidas son demasiado tentadoras para ignorarlas.',
    portada: '/images/join-friends.png',
    master: 'DarkMaster',
    jugadores: [
      { id: 4, nombre: 'Gandor', avatar: undefined },
      { id: 5, nombre: 'Lyra', avatar: undefined },
      { id: 6, nombre: 'Thork', avatar: undefined },
    ],
    maxJugadores: 4,
    sesiones: 12,
    sistema: 'D&D 5e',
    dificultad: 'Épica',
    estado: 'Abierta',
    nivelMinimo: 5,
  },
  {
    id: 4,
    nombre: 'Inicio del Aventurero',
    descripcion: 'Campaña perfecta para nuevos jugadores. Una historia de introducción al mundo del rol con mecánicas simples y mucha diversión.',
    historia: 'Un pequeño pueblo necesita ayuda. Monstruos están atacando los campos y el alcalde no sabe qué hacer. Los aventureros novatos son la última esperanza de los aldeanos.',
    portada: '/images/join-friends.png',
    master: 'GuíaRol',
    jugadores: [],
    maxJugadores: 6,
    sesiones: 3,
    sistema: 'D&D 5e',
    dificultad: 'Fácil',
    estado: 'Abierta',
    nivelMinimo: 1,
  },
  {
    id: 5,
    nombre: 'La Torre del Hechicero Loco',
    descripcion: 'Un hechicero excéntrico ha lanzado un hechizo que está afectando a toda la región. Alguien tiene que subir a su torre y detenerle.',
    historia: 'El hechicero Malachar lleva semanas encerrado en su torre haciendo experimentos. Sus hechizos fallidos han comenzado a transformar animales, cambiar el clima y volver locos a los aldeanos cercanos.',
    portada: '/images/join-friends.png',
    master: 'WizardPro',
    jugadores: [
      { id: 7, nombre: 'Rolo', avatar: undefined },
    ],
    maxJugadores: 4,
    sesiones: 4,
    sistema: 'D&D 5e',
    dificultad: 'Media',
    estado: 'Abierta',
    nivelMinimo: 2,
  },
  {
    id: 6,
    nombre: 'Piratas del Mar de las Espadas',
    descripcion: 'Aventuras en alta mar, tesoros piratas y ciudades flotantes. Una campaña épica de exploración y combate naval.',
    historia: 'Una flota pirata lleva meses saqueando los puertos del Mar de las Espadas. El rey ofrece una recompensa enorme a quien traiga a su cabecilla muerto o vivo.',
    portada: '/images/join-friends.png',
    master: 'SeaCaptain',
    jugadores: [
      { id: 8, nombre: 'Marina', avatar: undefined },
      { id: 9, nombre: 'Corsario', avatar: undefined },
    ],
    maxJugadores: 5,
    sesiones: 10,
    sistema: 'D&D 5e',
    dificultad: 'Difícil',
    estado: 'Abierta',
    nivelMinimo: 4,
  },
];

const DIFICULTAD_COLOR: Record<string, string> = {
  'Fácil':   '#2ecc71',
  'Media':   '#f39c12',
  'Difícil': '#e74c3c',
  'Épica':   '#9b59b6',
};

// ── MODAL DETALLE ─────────────────────────────────────────
function ModalCampana({ campana, onClose }: { campana: Campana; onClose: () => void }) {
  const plazasLibres = campana.maxJugadores - campana.jugadores.length;

  return (
    <div className="jg-modal-overlay" onClick={onClose}>
      <div className="jg-modal" onClick={e => e.stopPropagation()}>

        {/* IMAGEN CABECERA */}
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

          {/* STATS */}
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

          {/* HISTORIA */}
          <div className="jg-modal-seccion">
            <h4 className="jg-modal-seccion-titulo">Historia de la Campaña</h4>
            <p className="jg-modal-texto">{campana.historia}</p>
          </div>

          {/* JUGADORES */}
          <div className="jg-modal-seccion">
            <h4 className="jg-modal-seccion-titulo">Aventureros en la partida</h4>
            {campana.jugadores.length === 0 ? (
              <p className="jg-modal-texto" style={{ opacity: 0.5 }}>Sé el primero en unirte</p>
            ) : (
              <div className="jg-jugadores-lista">
                {campana.jugadores.map(j => (
                  <div key={j.id} className="jg-jugador-chip">
                    <div className="jg-jugador-avatar">
                      {j.avatar
                        ? <img src={j.avatar} alt={j.nombre} />
                        : j.nombre.charAt(0).toUpperCase()
                      }
                    </div>
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

          {/* BOTÓN UNIRSE */}
          <button
            className="jg-btn-unirse"
            disabled={plazasLibres === 0}
          >
            {plazasLibres > 0 ? '⚔ Unirme a esta Campaña' : 'Campaña Completa'}
          </button>

        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function JoinGame() {
  const navigate = useNavigate();
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [filtro, setFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');

  const campanasFiltradas = CAMPANAS_MOCK.filter(c => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.master.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || c.dificultad.toLowerCase() === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  return (
    <div className="jg-page">

      {/* FONDO CON IMAGEN */}
      <div className="jg-bg" />

      <BackButton />

      <div className="jg-contenido">

        {/* CABECERA */}
        <div className="jg-header">
          <h1 className="jg-titulo">Únete a una Aventura</h1>
          <p className="jg-subtitulo">Encuentra tu grupo y forja tu leyenda en RavenLoft Castle</p>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="jg-controles">
          <div className="jg-busqueda-wrap">
            <span className="jg-busqueda-icon">🔍</span>
            <input
              className="jg-busqueda"
              placeholder="Buscar campaña o master..."
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

        {/* GRID DE CAMPAÑAS */}
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
                {/* PORTADA */}
                <div className="jg-card-img-wrap">
                  {campana.portada
                    ? <img src={campana.portada} alt={campana.nombre} className="jg-card-img" />
                    : <div className="jg-card-img-placeholder">⚔</div>
                  }
                  <div className="jg-card-overlay" />
                  <span
                    className="jg-card-dificultad"
                    style={{ background: DIFICULTAD_COLOR[campana.dificultad] }}
                  >
                    {campana.dificultad}
                  </span>
                  <span className="jg-card-sesiones">📅 {campana.sesiones} sesiones</span>
                </div>

                {/* INFO */}
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

      </div>

      {/* MODAL */}
      {campanaSeleccionada && (
        <ModalCampana
          campana={campanaSeleccionada}
          onClose={() => setCampanaSeleccionada(null)}
        />
      )}

    </div>
  );
}