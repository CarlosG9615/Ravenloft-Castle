import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JoinGame.css';
import { API_URL } from '../../services/api';
import { obtenerCampanasActivas } from '../../services/campanaService';
import { getMySuscripciones, getUserSuscripciones } from '../../services/suscripcionService';
import { getCampanaUrl, getModoHistoriaImageCandidates } from '../../utils/imageUtils';
import { useAuth } from '../../services/AuthContext';

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
  masterId?: number;
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

const VISTA_JOIN_GAME_STORAGE_KEY = 'ravenloft.joinGame.vistaActual';
const SUSCRIPCION_JOIN_GAME_STORAGE_KEY = 'ravenloft.joinGame.tipoSuscripcion';

const resolverTipoSuscripcionPersistida = (): TipoSuscripcion => {
  const guardada = sessionStorage.getItem(SUSCRIPCION_JOIN_GAME_STORAGE_KEY);
  if (guardada === 'PREMIUM' || guardada === 'VIP') return guardada;
  if (guardada === 'BASICA') return 'BASICA';

  const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw) as { suscripcion?: string; suscripcionTipo?: TipoSuscripcion };
      if (user.suscripcionTipo === 'PREMIUM' || user.suscripcionTipo === 'VIP' || user.suscripcionTipo === 'BASICA') {
        return user.suscripcionTipo;
      }
      const tipoDesdeStorage = resolverTipoDesdeTexto(user.suscripcion);
      if (tipoDesdeStorage) return tipoDesdeStorage;
    } catch {
      // Si el storage está corrupto, caemos al valor por defecto.
    }
  }

  return 'BASICA';
};

const leerVistaInicial = (): 'campanas' | 'modos-historia' => {
  const vistaGuardada = sessionStorage.getItem(VISTA_JOIN_GAME_STORAGE_KEY);
  return vistaGuardada === 'modos-historia' ? 'modos-historia' : 'campanas';
};

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
  if (normalizado.includes('PREMIUM') || normalizado.includes('HEROE') || normalizado.includes('HÉROE')) return 'PREMIUM';
  if (
    normalizado.includes('BASICA') ||
    normalizado.includes('BÁSICA') ||
    normalizado.includes('AVENTURERO') ||
    normalizado.includes('FREE') ||
    normalizado.includes('GRATIS')
  ) return 'BASICA';

  return null;
};

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

const normalizarDificultad = (texto: string): string => {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

function ModoHistoriaCover({
  titulo,
  imageClassName,
  placeholderClassName,
}: {
  titulo: string;
  imageClassName: string;
  placeholderClassName: string;
}) {
  const candidates = getModoHistoriaImageCandidates(titulo);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [sinPortada, setSinPortada] = useState(candidates.length === 0);

  useEffect(() => {
    setCandidateIndex(0);
    setSinPortada(candidates.length === 0);
  }, [titulo, candidates.length]);

  if (sinPortada || !candidates[candidateIndex]) {
    return (
      <div className={placeholderClassName} aria-label="Plantilla de portada">
        <span className="jg-card-modo-plantilla-texto">Portada próximamente</span>
      </div>
    );
  }

  return (
    <img
      src={candidates[candidateIndex]}
      alt={`Portada de ${titulo}`}
      className={imageClassName}
      onError={() => {
        if (candidateIndex < candidates.length - 1) {
          setCandidateIndex(prev => prev + 1);
          return;
        }
        setSinPortada(true);
      }}
      loading="lazy"
    />
  );
}

// ── MODAL CAMPAÑA ─────────────────────────────────────────
function ModalCampana({
  campana,
  onClose
}: {
  campana: Campana;
  onClose: () => void;
}) {
  const plazasLibres = campana.maxJugadores - campana.jugadores.length;
  const navigate = useNavigate();

  const { user } = useAuth();
  const soyMaster = typeof user?.id === 'number' && campana.masterId === user.id;

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
              <button
                className={`jg-btn-unirse ${soyMaster ? 'jg-btn-master' : ''}`}
                disabled={!soyMaster && plazasLibres === 0}
                onClick={() => {
                  if (soyMaster) {
                    navigate('/tablero', {
                      state: {
                      campanaId: campana.id,
                      campaaNombre: campana.nombre,
                      mapaUrl: '/images/mapas/bosque/caminoForestal.jpg',
                      jugadores: campana.jugadores,
                      esMaster: true, 
                      jugadorActual: {
                        id: user?.id || Date.now(),
                        nombre: user?.nombre || 'Tú',
                        clase: 'Aventurero',
                        hp: 20,
                        hpMax: 20,
                        conectado: true
                      }
                    }
                  });
                    return;
                  }

                  const jugadorRed = {
                    id: user?.id || Date.now(),
                    nombre: user?.nombre || 'Tú',
                    clase: 'Aventurero',
                    hp: 20,
                    hpMax: 20,
                    conectado: true
                  };
                  const misJugadores = [...campana.jugadores, jugadorRed];
                  navigate('/tablero', {
                    state: {
                      campanaId: campana.id,
                      campaaNombre: campana.nombre,
                      mapaUrl: '/images/mapas/bosque/caminoForestal.jpg',
                      jugadores: misJugadores,
                      esMaster: false,
                      jugadorActual: jugadorRed
                    }
                  });
                }}
              >
                {soyMaster ? '👑 Liderar la campaña' : (plazasLibres > 0 ? '⚔ Unirme a esta Campaña' : 'Campaña Completa')}
              </button>
              
        </div>
      </div>
    </div>
  );
}

// ── MODAL MODO HISTORIA ──────────────────────────────────
function ModalModoHistoria({
  modoHistoria,
  onClose,
  onEntrarModoHistoria,
}: {
  modoHistoria: ModoHistoria;
  onClose: () => void;
  onEntrarModoHistoria: (modoHistoria: ModoHistoria) => void;
}) {
  const personajesActivos = modoHistoria.personajes.length;
  const plazasLibres = modoHistoria.maxJugadores - personajesActivos;
  const misionesTotales = modoHistoria.misiones.length;

  return (
    <div className="jg-modal-overlay" onClick={onClose}>
      <div className="jg-modal" onClick={e => e.stopPropagation()}>
        <div className="jg-modal-hero jg-modal-hero-modo">
          <ModoHistoriaCover
            titulo={modoHistoria.nombre}
            imageClassName="jg-modal-hero-modo-img"
            placeholderClassName="jg-card-modo-plantilla"
          />
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
          <button
            className="jg-btn-unirse"
            disabled={plazasLibres === 0}
            onClick={() => onEntrarModoHistoria(modoHistoria)}
          >
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
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [modoHistoriaSeleccionado, setModoHistoriaSeleccionado] = useState<ModoHistoria | null>(null);
  const [modoBloqueadoSeleccionado, setModoBloqueadoSeleccionado] = useState<{ nombre: string; nivelRequerido: TipoSuscripcion } | null>(null);
  const [vistaActual, setVistaActual] = useState<'campanas' | 'modos-historia'>(leerVistaInicial);
  const [filtro, setFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modosHistoria, setModosHistoria] = useState<ModoHistoria[]>([]);
  const [cargandoModosHistoria, setCargandoModosHistoria] = useState(false);
  const [errorModosHistoria, setErrorModosHistoria] = useState<string | null>(null);
  const [tipoSuscripcionUsuario, setTipoSuscripcionUsuario] = useState<TipoSuscripcion>(resolverTipoSuscripcionPersistida);

  useEffect(() => {
    const cargarCampanas = async () => {
      try {
        const data = await obtenerCampanasActivas();
        const mapped: Campana[] = data.map(c => ({
          id: c.id,
          nombre: c.nombre,
          descripcion: c.descripcion || c.nombre,
          historia: c.descripcion || c.nombre,
          portada: getCampanaUrl(c.nombre),
          masterId: c.masterId,
          master: c.masterNombre || 'Master',
          jugadores: [], // Sin jugadores por ahora
          maxJugadores: c.maxJugadores || 10,
          sesiones: c.numSesiones || 0,
          sistema: c.sistema || 'D&D 5e',
          dificultad: c.dificultad || 'Media',
          estado: c.active ? 'Abierta' : 'Completa',
          nivelMinimo: c.nivelMinimo || 1
        }));
        setCampanas(mapped);
      } catch (e) {
        console.error('Error al cargar campañas', e);
      }
    };
    cargarCampanas();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(VISTA_JOIN_GAME_STORAGE_KEY, vistaActual);
  }, [vistaActual]);

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
    sessionStorage.setItem(SUSCRIPCION_JOIN_GAME_STORAGE_KEY, tipoSuscripcionUsuario);
  }, [tipoSuscripcionUsuario]);

  useEffect(() => {
    const cargarSuscripcionUsuario = async () => {
      try {
        const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userRaw) {
          setTipoSuscripcionUsuario('BASICA');
          return;
        }

        const user = JSON.parse(userRaw) as { id?: number; suscripcion?: string; suscripcionTipo?: TipoSuscripcion };

        if (user.suscripcionTipo === 'PREMIUM' || user.suscripcionTipo === 'VIP' || user.suscripcionTipo === 'BASICA') {
          setTipoSuscripcionUsuario(user.suscripcionTipo);
        }

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
        // Si falla la carga, conservamos la suscripción que ya teníamos para no degradar al usuario.
      }
    };

    cargarSuscripcionUsuario();
  }, []);

  const usuarioPuedeVerModo = (modo: ModoHistoria) => {
    const nivelRequerido = (modo.nivelAcceso ?? 'BASICA') as TipoSuscripcion;
    return NIVEL_SUSCRIPCION[tipoSuscripcionUsuario] >= NIVEL_SUSCRIPCION[nivelRequerido];
  };

  const campanasFiltradas = campanas.filter(c => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.master.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || normalizarDificultad(c.dificultad) === normalizarDificultad(filtro);
    return coincideBusqueda && coincideFiltro;
  });

  const modosHistoriaFiltrados = modosHistoria.filter(modo => {
    const textoMaster = modo.master?.nombre ?? '';
    const coincideBusqueda = modo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      textoMaster.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === 'todas' || normalizarDificultad(modo.dificultad) === normalizarDificultad(filtro);
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

  const handleEntrarModoHistoria = (modoHistoria: ModoHistoria) => {
    setModoHistoriaSeleccionado(null);
    navigate(`/story-mode/${modoHistoria.id}`, {
      state: { modoHistoria },
    });
  };

  return (
    <div className="jg-page">
      <div className={`jg-bg ${vistaEsCampanas ? 'is-campanas' : 'is-modos-historia'}`} aria-hidden="true">
        <div className="jg-bg-overlay" />
      </div>

      <div className="jg-contenido">

        {/* CABECERA */}
        <div className="jg-header">
          <h1 className="jg-titulo">Unirte a una partida</h1>
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
                          👥 {campana.jugadores.length > 0 ? `${campana.jugadores.length}/${campana.maxJugadores}` : `0/${campana.maxJugadores}`}
                        </span>
                      </div>
                      <div className="jg-card-modo-meta">
                        <span className="jg-card-modo-personajes">✨ {plazasLibres > 0 ? `${plazasLibres} plazas libres` : 'Completa'}</span>
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
                          <ModoHistoriaCover
                            titulo={modoHistoria.nombre}
                            imageClassName="jg-card-modo-img"
                            placeholderClassName="jg-card-modo-plantilla"
                          />
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
        <ModalCampana
          campana={campanaSeleccionada}
          onClose={() => setCampanaSeleccionada(null)}
        />
      )}
      {modoHistoriaSeleccionado && (
        <ModalModoHistoria
          modoHistoria={modoHistoriaSeleccionado}
          onClose={() => setModoHistoriaSeleccionado(null)}
          onEntrarModoHistoria={handleEntrarModoHistoria}
        />
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
