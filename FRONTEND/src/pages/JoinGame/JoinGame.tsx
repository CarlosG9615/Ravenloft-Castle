import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JoinGame.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { API_URL } from '../../services/api';
import { getMySuscripciones, getUserSuscripciones } from '../../services/suscripcionService';
import { getCampanaUrl } from '../../utils/imageUtils';

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

interface ModoHistoria {
  id: number;
  nombre: string;
  descripcion: string;
  dificultad: 'Fácil' | 'Media' | 'Difícil' | 'Épica';
  nivelMinimo: number;
  maxJugadores: number;
  nivelAcceso?: 'BASICA' | 'PREMIUM' | 'VIP';
  active: boolean;
  master: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
  personajes: Array<{
    id: number;
    usuarioNombre?: string;
    nombre?: string;
    avatar?: string;
  }>;
  misiones: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    orden: number;
    dificultad: string;
    xpRecompensa: number;
    completada: boolean;
  }>;
}

interface SuscripcionResumen {
  tipo?: string | null;
  estado?: string | null;
}

type TipoSuscripcion = 'BASICA' | 'PREMIUM' | 'VIP';

const NIVEL_SUSCRIPCION: Record<TipoSuscripcion, number> = {
  BASICA: 1,
  PREMIUM: 2,
  VIP: 3,
};

const PLANES_SUSCRIPCION: Array<{ tipo: TipoSuscripcion; nombre: string; precio: string; descripcion: string }> = [
  {
    tipo: 'BASICA',
    nombre: 'Aventurero',
    precio: 'Gratis',
    descripcion: 'Ideal para empezar tu aventura.',
  },
  {
    tipo: 'PREMIUM',
    nombre: 'Heroe',
    precio: '4.99 EUR/mes',
    descripcion: 'Desbloquea modos e historias premium.',
  },
  {
    tipo: 'VIP',
    nombre: 'Dungeon Master',
    precio: '9.99 EUR/mes',
    descripcion: 'Acceso total para jugadores avanzados.',
  },
];

const resolverTipoDesdeTexto = (valor?: string | null): TipoSuscripcion | null => {
  if (!valor) return null;
  const normalizado = valor.trim().toUpperCase();

  if (normalizado.includes('VIP')) return 'VIP';
  if (normalizado.includes('PREMIUM')) return 'PREMIUM';
  if (normalizado.includes('BASICA') || normalizado.includes('BÁSICA')) return 'BASICA';

  return null;
};

// ── DATOS CAMPAÑAS ────────────────────────────────────────
const CAMPANAS_MOCK: Campana[] = [
  {
    id: 1,
    nombre: 'La Maldición del Dragón Esmeralda',
    descripcion: 'Una antigua maldición despierta en las ruinas de Khel\'thar. Buscamos valientes aventureros para detener al dragón antes de que arrase las tierras del norte.',
    historia: 'Hace mil años, el dragón Verthax fue sellado bajo las montañas de Khel\'thar por un grupo de héroes. Ahora el sello se debilita y necesitamos nuevos héroes que completen el ritual antes del solsticio de invierno.',
    portada: getCampanaUrl('La Maldición del Dragón Esmeralda'),
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
    portada: getCampanaUrl('Los Secretos de Mirkwood'),
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
    portada: getCampanaUrl('El Dungeon Olvidado'),
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
    portada: getCampanaUrl('Inicio del Aventurero'),
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
    portada: getCampanaUrl('La Torre del Hechicero Loco'),
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
    portada: getCampanaUrl('Piratas del Mar de las Espadas'),
    master: 'SeaCaptain',
    jugadores: [{ id: 8, nombre: 'Marina' }, { id: 9, nombre: 'Corsario' }],
    maxJugadores: 5, sesiones: 10, sistema: 'D&D 5e',
    dificultad: 'Difícil', estado: 'Abierta', nivelMinimo: 4,
  },
];

const DIFICULTAD_COLOR: Record<string, string> = {
  'Fácil':   '#2ecc71',
  'Media':   '#f39c12',
  'Difícil': '#e74c3c',
  'Épica':   '#9b59b6',
};

const getDificultadColor = (dificultad?: string): string => {
  const normalizada = (dificultad ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  if (normalizada === 'FACIL') return DIFICULTAD_COLOR['Fácil'];
  if (normalizada === 'MEDIA') return DIFICULTAD_COLOR.Media;
  if (normalizada === 'DIFICIL') return DIFICULTAD_COLOR['Difícil'];
  if (normalizada === 'EPICA') return DIFICULTAD_COLOR['Épica'];

  return 'rgba(90, 90, 90, 0.95)';
};

// ── MODAL CAMPAÑA ─────────────────────────────────────────
function ModalCampana({ campana, onClose }: { campana: Campana; onClose: () => void }) {
  const plazasLibres = campana.maxJugadores - campana.jugadores.length;

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
            <span className="jg-dificultad-badge" style={{ background: getDificultadColor(campana.dificultad) }}>
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
          <button className="jg-btn-unirse" disabled={plazasLibres === 0}>
            {plazasLibres > 0 ? '⚔ Unirme a esta Campaña' : 'Campaña Completa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL MODO HISTORIA ──────────────────────────────────
function ModalModoHistoria({ modoHistoria, onClose }: { modoHistoria: ModoHistoria; onClose: () => void }) {
  const personajesActivos = modoHistoria.personajes.length;
  const plazasLibres = modoHistoria.maxJugadores - personajesActivos;
  const misionesTotales = modoHistoria.misiones.length;

  return (
    <div className="jg-modal-overlay" onClick={onClose}>
      <div className="jg-modal" onClick={e => e.stopPropagation()}>
        <div className="jg-modal-hero jg-modal-hero-modo">
          <div className="jg-card-modo-plantilla" aria-label="Plantilla de portada">
            <span className="jg-card-modo-plantilla-texto">Portada próximamente</span>
          </div>
          <div className="jg-modal-hero-overlay" />
          <button className="jg-modal-close" onClick={onClose}>✕</button>
          <div className="jg-modal-hero-info">
            <span className="jg-dificultad-badge" style={{ background: getDificultadColor(modoHistoria.dificultad) }}>
              {modoHistoria.dificultad}
            </span>
            <h2 className="jg-modal-titulo">{modoHistoria.nombre}</h2>
            <p className="jg-modal-sistema">{modoHistoria.master?.nombre ?? 'Sin master'} · Nivel mín. {modoHistoria.nivelMinimo}</p>
          </div>
        </div>
        <div className="jg-modal-body">
          <div className="jg-modal-stats">
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Master</span>
              <span className="jg-modal-stat-valor">⚔ {modoHistoria.master?.nombre ?? 'Sin master'}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Misiones</span>
              <span className="jg-modal-stat-valor">📜 {misionesTotales}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Personajes</span>
              <span className="jg-modal-stat-valor">👥 {personajesActivos} / {modoHistoria.maxJugadores}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Plazas libres</span>
              <span className="jg-modal-stat-valor">✨ {plazasLibres}</span>
            </div>
          </div>
          <div className="jg-modal-seccion">
            <h4 className="jg-modal-seccion-titulo">Descripción del modo</h4>
            <p className="jg-modal-texto">{modoHistoria.descripcion}</p>
          </div>
          <div className="jg-modal-seccion">
            <h4 className="jg-modal-seccion-titulo">Personajes en el modo</h4>
            {modoHistoria.personajes.length === 0 ? (
              <p className="jg-modal-texto" style={{ opacity: 0.5 }}>Todavía no hay personajes registrados</p>
            ) : (
              <div className="jg-modo-personajes-lista">
                {modoHistoria.personajes.map(personaje => {
                  const nombreVisible = personaje.usuarioNombre ?? personaje.nombre ?? 'Jugador';
                  return (
                    <div key={personaje.id} className="jg-jugador-chip">
                      <div className="jg-jugador-avatar">{nombreVisible.charAt(0).toUpperCase()}</div>
                      <span>{nombreVisible}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button className="jg-btn-unirse" disabled={plazasLibres === 0}>
            {plazasLibres > 0 ? '⚔ Entrar al Modo Historia' : 'Modo Historia Completo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSuscripcionRequerida({
  nivelActual,
  nivelRequerido,
  nombreModo,
  onClose,
  onIrASuscripciones,
}: {
  nivelActual: TipoSuscripcion;
  nivelRequerido: TipoSuscripcion;
  nombreModo: string;
  onClose: () => void;
  onIrASuscripciones: () => void;
}) {
  const planesDisponibles = PLANES_SUSCRIPCION.filter(
    plan => NIVEL_SUSCRIPCION[plan.tipo] > NIVEL_SUSCRIPCION[nivelActual],
  );

  return (
    <div className="jg-modal-overlay" onClick={onClose}>
      <div className="jg-modal jg-upgrade-modal" onClick={e => e.stopPropagation()}>
        <button className="jg-modal-close" onClick={onClose}>✕</button>
        <div className="jg-upgrade-header">
          <h3>Necesitas mejorar tu suscripcion</h3>
          <p>
            El modo <strong>{nombreModo}</strong> requiere plan <strong>{nivelRequerido}</strong>.
          </p>
        </div>

        <div className="jg-upgrade-planes">
          {planesDisponibles.length === 0 ? (
            <p className="jg-upgrade-vacio">Ya tienes el plan mas alto disponible.</p>
          ) : (
            planesDisponibles.map(plan => (
              <div key={plan.tipo} className="jg-upgrade-plan-card">
                <div className="jg-upgrade-plan-top">
                  <span className="jg-upgrade-plan-tipo">{plan.tipo}</span>
                  <span className="jg-upgrade-plan-precio">{plan.precio}</span>
                </div>
                <h4>{plan.nombre}</h4>
                <p>{plan.descripcion}</p>
              </div>
            ))
          )}
        </div>

        <div className="jg-upgrade-actions">
          <button type="button" className="jg-upgrade-btn-sec" onClick={onClose}>Ahora no</button>
          <button type="button" className="jg-upgrade-btn-pri" onClick={onIrASuscripciones}>Ver suscripciones</button>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function JoinGame() {
  const navigate = useNavigate();
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [modoHistoriaSeleccionado, setModoHistoriaSeleccionado] = useState<ModoHistoria | null>(null);
  const [modoBloqueadoSeleccionado, setModoBloqueadoSeleccionado] = useState<{ nombre: string; nivelRequerido: TipoSuscripcion } | null>(null);
  const [vistaActual, setVistaActual] = useState<'campanas' | 'modos-historia'>('campanas');
  const [filtro, setFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modosHistoria, setModosHistoria] = useState<ModoHistoria[]>([]);
  const [cargandoModosHistoria, setCargandoModosHistoria] = useState(false);
  const [errorModosHistoria, setErrorModosHistoria] = useState<string | null>(null);
  const [tipoSuscripcionUsuario, setTipoSuscripcionUsuario] = useState<TipoSuscripcion>('BASICA');

  useEffect(() => {
    const controller = new AbortController();

    const cargarModosHistoria = async () => {
      setCargandoModosHistoria(true);
      setErrorModosHistoria(null);

      try {
        const response = await fetch(`${API_URL}/api/modos-historia`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`No se pudieron cargar los modos historia (${response.status})`);
        }

        const data = await response.json() as ModoHistoria[];
        setModosHistoria(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorModosHistoria(error instanceof Error ? error.message : 'Error cargando modos historia');
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargandoModosHistoria(false);
        }
      }
    };

    cargarModosHistoria();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const cargarSuscripcionUsuario = async () => {
      try {
        const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userRaw) {
          setTipoSuscripcionUsuario('BASICA');
          return;
        }

        const user = JSON.parse(userRaw) as { id?: number; suscripcion?: string };

        const tipoDesdeStorage = resolverTipoDesdeTexto(user.suscripcion);
        if (tipoDesdeStorage) {
          setTipoSuscripcionUsuario(tipoDesdeStorage);
        }

        let suscripciones = await getMySuscripciones();

        if (suscripciones.length === 0 && user.id) {
          // Fallback por compatibilidad si el backend no resolviera /api/suscripciones por usuario autenticado.
          suscripciones = await getUserSuscripciones(user.id);
        }

        const suscripcionesActivas = (suscripciones as SuscripcionResumen[]).filter(s =>
          (s.estado ?? '').trim().toUpperCase() === 'ACTIVA',
        );

        if (suscripcionesActivas.length === 0) {
          if (!tipoDesdeStorage) {
            setTipoSuscripcionUsuario('BASICA');
          }
          return;
        }

        const tipoMasAlto = suscripcionesActivas.reduce<TipoSuscripcion>((acumulado, actual) => {
          const tipoActual = resolverTipoDesdeTexto(actual.tipo) ?? 'BASICA';
          return NIVEL_SUSCRIPCION[tipoActual] > NIVEL_SUSCRIPCION[acumulado] ? tipoActual : acumulado;
        }, 'BASICA');

        setTipoSuscripcionUsuario(tipoMasAlto);
      } catch {
        setTipoSuscripcionUsuario('BASICA');
      }
    };

    cargarSuscripcionUsuario();
  }, []);

  const usuarioPuedeVerModo = (modo: ModoHistoria) => {
    const nivelRequerido = (modo.nivelAcceso ?? 'BASICA') as TipoSuscripcion;
    return NIVEL_SUSCRIPCION[tipoSuscripcionUsuario] >= NIVEL_SUSCRIPCION[nivelRequerido];
  };

  const campanasFiltradas = CAMPANAS_MOCK.filter(c => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.master.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || c.dificultad.toLowerCase() === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  const modosHistoriaFiltrados = modosHistoria.filter(modo => {
    const textoMaster = modo.master?.nombre ?? '';
    const coincideBusqueda = modo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      textoMaster.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || modo.dificultad.toLowerCase() === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  const vistaEsCampanas = vistaActual === 'campanas';
  const tituloSeccion = vistaEsCampanas ? 'CAMPAÑAS' : 'MODO HISTORIA';
  const placeholderBusqueda = vistaEsCampanas ? 'Buscar campaña o master...' : 'Buscar modo historia o master...';

  const handleCambiarVistaHistoria = () => {
    setVistaActual(vistaAnterior => vistaAnterior === 'campanas' ? 'modos-historia' : 'campanas');
    setFiltro('todas');
    setBusqueda('');
    setCampanaSeleccionada(null);
    setModoHistoriaSeleccionado(null);
  };

  const handleSeleccionModoHistoria = (modoHistoria: ModoHistoria) => {
    const nivelRequerido = (modoHistoria.nivelAcceso ?? 'BASICA') as TipoSuscripcion;

    if (!usuarioPuedeVerModo(modoHistoria)) {
      setModoBloqueadoSeleccionado({
        nombre: modoHistoria.nombre,
        nivelRequerido,
      });
      return;
    }

    setModoHistoriaSeleccionado(modoHistoria);
  };

  const handleIrASuscripciones = () => {
    setModoBloqueadoSeleccionado(null);
    navigate('/subscription');
  };

  return (
    <div className="jg-page">
      <div className="jg-bg" />
      <BackButton />

      <div className="jg-contenido">

        {/* CABECERA */}
        <div className="jg-header">
          <h1 className="jg-titulo">Unirse a partida</h1>
          <h2 className="jg-subtitulo">Unete a una aventura</h2>
          <p className="jg-descripcion">Encuentra tu grupo y forja tu leyenda en RavenLoft Castle</p>
        </div>

        {/* CONTROLES */}
        <div className="jg-controles">
          <div className="jg-busqueda-wrap">
            <span className="jg-busqueda-icon">🔍</span>
            <input
              className="jg-busqueda"
              placeholder={placeholderBusqueda}
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

        {/* TÍTULO DE SECCIÓN */}
        <div className="jg-seccion-titulo-wrap" aria-label={tituloSeccion}>
          <div className="jg-seccion-titulo-top">
            <div className="jg-seccion-titulo">{tituloSeccion}</div>
            <button
              type="button"
              className={`jg-modo-historia-btn jg-modo-historia-btn-inline ${vistaEsCampanas ? '' : 'active'}`}
              onClick={handleCambiarVistaHistoria}
              aria-pressed={!vistaEsCampanas}
            >
              {vistaEsCampanas && <span className="jg-modo-historia-badge">nuevo</span>}
              <span className="jg-modo-historia-texto">{vistaEsCampanas ? 'Modo Historia' : 'CAMPAÑA'}</span>
            </button>
          </div>
          <div className="jg-seccion-titulo-linea" />
        </div>

        {vistaEsCampanas ? (
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
                      <span className="jg-card-dificultad" style={{ background: getDificultadColor(campana.dificultad) }}>
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
        ) : (
          <>
            {cargandoModosHistoria ? (
              <div className="jg-vacio">
                <div className="jg-vacio-icon">📖</div>
                <p>Cargando modos historia...</p>
              </div>
            ) : errorModosHistoria ? (
              <div className="jg-vacio">
                <div className="jg-vacio-icon">⚠</div>
                <p>{errorModosHistoria}</p>
              </div>
            ) : (
              <>
                <div className="jg-grid">
                  {modosHistoriaFiltrados.map((modoHistoria, i) => {
                    const personajesActivos = modoHistoria.personajes.length;
                    const plazasLibres = modoHistoria.maxJugadores - personajesActivos;
                    const misionesTotales = modoHistoria.misiones.length;

                    return (
                      <div
                        key={modoHistoria.id}
                        className="jg-card jg-card-modo-historia"
                        style={{ animationDelay: `${i * 0.08}s` }}
                        onClick={() => handleSeleccionModoHistoria(modoHistoria)}
                      >
                        {(modoHistoria.nivelAcceso ?? 'BASICA') !== 'BASICA' && (
                          <span className="jg-card-premium-chip">{modoHistoria.nivelAcceso}</span>
                        )}
                        <div className="jg-card-modo-hero">
                          <div className="jg-card-modo-plantilla" aria-label="Plantilla de portada">
                            <span className="jg-card-modo-plantilla-texto">Portada próximamente</span>
                          </div>
                          <div className="jg-card-overlay" />
                          <span className="jg-card-dificultad" style={{ background: getDificultadColor(modoHistoria.dificultad) }}>
                            {modoHistoria.dificultad}
                          </span>
                          <span className="jg-card-misiones">📜 {misionesTotales} misiones</span>
                        </div>
                        <div className="jg-card-info">
                          <h3 className="jg-card-nombre">{modoHistoria.nombre}</h3>
                          <p className="jg-card-desc">{modoHistoria.descripcion}</p>
                          <div className="jg-card-footer">
                            <span className="jg-card-master">⚔ {modoHistoria.master?.nombre ?? 'Sin master'}</span>
                            <span className={`jg-card-plazas ${plazasLibres === 0 ? 'completa' : ''}`}>
                              👥 {personajesActivos > 0 ? `${personajesActivos}/${modoHistoria.maxJugadores}` : `0/${modoHistoria.maxJugadores}`}
                            </span>
                          </div>
                          <div className="jg-card-modo-meta">
                            <span className="jg-card-modo-nivel">Nv. mín. {modoHistoria.nivelMinimo}</span>
                            <span className="jg-card-modo-personajes">✨ {plazasLibres > 0 ? `${plazasLibres} plazas libres` : 'Completo'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {modosHistoriaFiltrados.length === 0 && (
                  <div className="jg-vacio">
                    <div className="jg-vacio-icon">📖</div>
                    <p>No se encontraron modos historia con esos criterios</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* MODALES */}
      {campanaSeleccionada && (
        <ModalCampana campana={campanaSeleccionada} onClose={() => setCampanaSeleccionada(null)} />
      )}
      {modoHistoriaSeleccionado && (
        <ModalModoHistoria modoHistoria={modoHistoriaSeleccionado} onClose={() => setModoHistoriaSeleccionado(null)} />
      )}
      {modoBloqueadoSeleccionado && (
        <ModalSuscripcionRequerida
          nivelActual={tipoSuscripcionUsuario}
          nivelRequerido={modoBloqueadoSeleccionado.nivelRequerido}
          nombreModo={modoBloqueadoSeleccionado.nombre}
          onClose={() => setModoBloqueadoSeleccionado(null)}
          onIrASuscripciones={handleIrASuscripciones}
        />
      )}
    </div>
  );
}