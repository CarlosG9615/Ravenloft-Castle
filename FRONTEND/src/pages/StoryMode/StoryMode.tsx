import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './StoryMode.css';
import { API_URL } from '../../services/api';
import { getMySuscripciones, getUserSuscripciones } from '../../services/suscripcionService';
import { getModoHistoriaImageCandidates, getAvatarUrl } from '../../utils/imageUtils';

const isAbsoluteUrl = (v: string) => /^https?:\/\//i.test(v);
const isAppPath    = (v: string) => v.startsWith('/');
const resolvePersonajeAvatar = (avatar?: string): string | undefined => {
  if (!avatar) return undefined;
  if (isAbsoluteUrl(avatar) || isAppPath(avatar)) return avatar;
  return getAvatarUrl(avatar);
};
import { buildMissionListPath } from '../Mission/missionRoutes';

// ── TIPOS ─────────────────────────────────────────────────
interface ModoHistoria {
  id: number;
  nombre: string;
  descripcion: string;
  dificultad: 'Fácil' | 'Media' | 'Difícil' | 'Épica';
  nivelMinimo: number;
  maxJugadores: number;
  jugadoresActuales?: number;
  mastersActuales?: number;
  plazasJugadorLibres?: number;
  plazasMasterLibres?: number;
  nivelAcceso?: 'BASICA' | 'PREMIUM' | 'VIP';
  active: boolean;
  master?: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  } | null;
  personajes: Array<{
    id: number;
    usuarioNombre?: string;
    nombre?: string;
    clase?: string;
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

const DIFICULTAD_COLOR: Record<string, string> = {
  'Fácil': '#2ecc71',
  'Media': '#f39c12',
  'Difícil': '#e74c3c',
  'Épica': '#9b59b6',
};

const NIVEL_SUSCRIPCION: Record<TipoSuscripcion, number> = {
  BASICA: 1,
  PREMIUM: 2,
  VIP: 3,
};

const NOMBRE_PARA_NIVEL: Record<TipoSuscripcion, string> = {
  BASICA: 'Héroe',
  PREMIUM: 'DM',
  VIP: 'Archimago',
};

const PLANES_SUSCRIPCION: Array<{ tipo: TipoSuscripcion; nombre: string; precio: string; descripcion: string }> = [
  {
    tipo: 'BASICA',
    nombre: 'Héroe',
    precio: '4.99 €/mes',
    descripcion: 'Para aventureros dedicados.',
  },
  {
    tipo: 'PREMIUM',
    nombre: 'DM',
    precio: '9.99 €/mes',
    descripcion: 'Todo el poder para crear mundos.',
  },
  {
    tipo: 'VIP',
    nombre: 'Archimago',
    precio: '19.99 €/mes',
    descripcion: 'El máximo poder para crear mundos épicos.',
  },
];

const resolverTipoDesdeTexto = (valor?: string | null): TipoSuscripcion | null => {
  if (!valor) return null;
  const normalizado = valor.trim().toUpperCase().replace(/_/g, ' ');

  if (normalizado.includes('ARCHIMAGO') || normalizado.includes('VIP')) return 'VIP';
  if (normalizado.includes('DUNGEON') || normalizado.includes('PREMIUM')) return 'PREMIUM';
  if (normalizado.includes('HEROE') || normalizado.includes('HÉROE') || normalizado.includes('BASICA') || normalizado.includes('BÁSICA')) return 'BASICA';

  return null;
};

const resolverTipoSuscripcionPersistida = (): TipoSuscripcion | null => {
  const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw) as { suscripcion?: string; suscripcionTipo?: TipoSuscripcion; suscripcionActiva?: boolean };
      if (!user.suscripcionActiva) return null;
      if (user.suscripcionTipo === 'PREMIUM' || user.suscripcionTipo === 'VIP' || user.suscripcionTipo === 'BASICA') {
        return user.suscripcionTipo;
      }
      return resolverTipoDesdeTexto(user.suscripcion);
    } catch {
      return null;
    }
  }
  return null;
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

const MAX_JUGADORES_ROL = 4;
const MAX_MASTER_ROL = 1;

const getJugadoresActuales = (modoHistoria: ModoHistoria): number => {
  if (typeof modoHistoria.jugadoresActuales === 'number') return modoHistoria.jugadoresActuales;
  return modoHistoria.personajes.length;
};

const getMastersActuales = (modoHistoria: ModoHistoria): number => {
  if (typeof modoHistoria.mastersActuales === 'number') return modoHistoria.mastersActuales;
  return modoHistoria.master ? 1 : 0;
};

const getPlazasJugadorLibres = (modoHistoria: ModoHistoria): number => {
  if (typeof modoHistoria.plazasJugadorLibres === 'number') {
    return Math.max(0, modoHistoria.plazasJugadorLibres);
  }
  return Math.max(0, MAX_JUGADORES_ROL - getJugadoresActuales(modoHistoria));
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
  const jugadoresActuales = getJugadoresActuales(modoHistoria);
  const mastersActuales = getMastersActuales(modoHistoria);
  const plazasJugadorLibres = getPlazasJugadorLibres(modoHistoria);
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
            <p className="jg-modal-sistema">
              <span className="jg-master-accent">{modoHistoria.master?.nombre ?? 'Sin master'}</span>
              {' · '}Nivel mín. {modoHistoria.nivelMinimo}
            </p>
          </div>
        </div>
        <div className="jg-modal-body">
          <div className="jg-modal-stats">
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Master</span>
              <span className="jg-modal-stat-valor jg-master-accent">⚔ {modoHistoria.master?.nombre ?? 'Sin master'}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Misiones</span>
              <span className="jg-modal-stat-valor">{misionesTotales}</span>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Plazas libres</span>
              <div className="jg-modal-plazas-roles" aria-label="Plazas por rol">
                <span className="jg-modal-stat-valor">{jugadoresActuales}/{MAX_JUGADORES_ROL}</span>
                <span style={{ margin: '0 4px' }}>/</span>
                <span className="jg-modal-stat-valor">{mastersActuales}/{MAX_MASTER_ROL}</span>
              </div>
            </div>
            <div className="jg-modal-stat">
              <span className="jg-modal-stat-label">Nivel requerido</span>
              <span className="jg-modal-stat-valor">Nivel {modoHistoria.nivelMinimo}</span>
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
                  const nombrePersonaje = personaje.nombre ?? personaje.usuarioNombre ?? 'Jugador';
                  return (
                    <div key={personaje.id} className="jg-jugador-chip">
                      {resolvePersonajeAvatar(personaje.avatar)
                        ? <img src={resolvePersonajeAvatar(personaje.avatar)} alt={nombrePersonaje} className="jg-jugador-avatar" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                        : <div className="jg-jugador-avatar">{nombrePersonaje.charAt(0).toUpperCase()}</div>
                      }
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                        <span>{nombrePersonaje}</span>
                        {personaje.usuarioNombre && <span style={{ fontSize: '0.75em', color: '#ffd700' }}>{personaje.usuarioNombre}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button
            className="jg-btn-unirse"
            disabled={plazasJugadorLibres === 0}
            onClick={() => onEntrarModoHistoria(modoHistoria)}
          >
            {plazasJugadorLibres > 0 ? '⚔ Entrar al Modo Historia' : 'Sin plazas de jugador'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSuscripcionRequerida({
  nivelRequerido,
  nombreModo,
  onClose,
  onIrASuscripciones,
}: {
  nivelRequerido: TipoSuscripcion;
  nombreModo: string;
  onClose: () => void;
  onIrASuscripciones: () => void;
}) {
  const planesQueDesbloquean = PLANES_SUSCRIPCION.filter(
    plan => NIVEL_SUSCRIPCION[plan.tipo] >= NIVEL_SUSCRIPCION[nivelRequerido],
  );

  return (
    <div className="jg-modal-overlay" onClick={onClose}>
      <div className="jg-modal jg-upgrade-modal" onClick={e => e.stopPropagation()}>
        <button className="jg-modal-close" onClick={onClose}>✕</button>
        <div className="jg-upgrade-header">
          <h3>Necesitas mejorar tu suscripción</h3>
          <p>
            El modo <strong>{nombreModo}</strong> requiere el plan <strong>{NOMBRE_PARA_NIVEL[nivelRequerido]}</strong> o superior.
          </p>
        </div>

        <div className="jg-upgrade-planes">
          {planesQueDesbloquean.map(plan => (
            <div key={plan.tipo} className="jg-upgrade-plan-card">
              <div className="jg-upgrade-plan-top">
                <span className="jg-upgrade-plan-tipo">{plan.nombre}</span>
                <span className="jg-upgrade-plan-precio">{plan.precio}</span>
              </div>
              <p>{plan.descripcion}</p>
            </div>
          ))}
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
export function StoryMode() {
  const navigate = useNavigate();
  const [modoHistoriaSeleccionado, setModoHistoriaSeleccionado] = useState<ModoHistoria | null>(null);
  const [modoBloqueadoSeleccionado, setModoBloqueadoSeleccionado] = useState<{ nombre: string; nivelRequerido: TipoSuscripcion } | null>(null);
  const [filtro, setFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modosHistoria, setModosHistoria] = useState<ModoHistoria[]>([]);
  const [cargandoModosHistoria, setCargandoModosHistoria] = useState(false);
  const [errorModosHistoria, setErrorModosHistoria] = useState<string | null>(null);
  const [tipoSuscripcionUsuario, setTipoSuscripcionUsuario] = useState<TipoSuscripcion | null>(resolverTipoSuscripcionPersistida);

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
          setTipoSuscripcionUsuario(null);
          return;
        }

        const user = JSON.parse(userRaw) as { id?: number; suscripcion?: string; suscripcionTipo?: TipoSuscripcion };

        let suscripciones = await getMySuscripciones();

        if (suscripciones.length === 0 && user.id) {
          suscripciones = await getUserSuscripciones(user.id);
        }

        const suscripcionesActivas = (suscripciones as SuscripcionResumen[]).filter(s =>
          (s.estado ?? '').trim().toUpperCase() === 'ACTIVA',
        );

        if (suscripcionesActivas.length === 0) {
          setTipoSuscripcionUsuario(null);
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
    if (!modo.nivelAcceso) return true;
    if (!tipoSuscripcionUsuario) return false;
    return NIVEL_SUSCRIPCION[tipoSuscripcionUsuario] >= NIVEL_SUSCRIPCION[modo.nivelAcceso];
  };

  const ORDEN_NIVEL: Record<string, number> = { null: 0, BASICA: 1, PREMIUM: 2, VIP: 3 };

  const modosHistoriaFiltrados = modosHistoria
    .filter(modo => {
      const textoMaster = modo.master?.nombre ?? '';
      const coincideBusqueda = modo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        textoMaster.toLowerCase().includes(busqueda.toLowerCase());
      const coincideFiltro = filtro === 'todas' || normalizarDificultad(modo.dificultad) === normalizarDificultad(filtro);
      return coincideBusqueda && coincideFiltro;
    })
    .sort((a, b) => {
      const nivelA = ORDEN_NIVEL[a.nivelAcceso ?? 'null'] ?? 0;
      const nivelB = ORDEN_NIVEL[b.nivelAcceso ?? 'null'] ?? 0;
      return nivelA - nivelB;
    });

  const handleSeleccionModoHistoria = (modoHistoria: ModoHistoria) => {
    if (!usuarioPuedeVerModo(modoHistoria)) {
      setModoBloqueadoSeleccionado({
        nombre: modoHistoria.nombre,
        nivelRequerido: modoHistoria.nivelAcceso as TipoSuscripcion,
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
    // Guardar ruta origen para el back button
    sessionStorage.setItem('storyModeOrigin', '/join/story-mode');
    navigate(buildMissionListPath(modoHistoria.id), {
      state: { modoHistoria },
    });
  };

  return (
    <div className="jg-page">
      <div className="jg-bg is-modos-historia" aria-hidden="true">
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
              placeholder="Buscar modo historia o master..."
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
        <div className="jg-seccion-titulo-wrap" aria-label="MODO HISTORIA">
          <div className="jg-seccion-titulo-top">
            <div className="jg-seccion-titulo">MODO HISTORIA</div>
            <button
              type="button"
              className="jg-modo-historia-btn jg-modo-historia-btn-inline"
              onClick={() => navigate('/join')}
            >
              <span className="jg-modo-historia-texto">Campañas</span>
            </button>
          </div>
          <div className="jg-seccion-titulo-linea" />
        </div>

        {/* CONTENIDO */}
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
                const jugadoresActuales = getJugadoresActuales(modoHistoria);
                const mastersActuales = getMastersActuales(modoHistoria);
                const plazasJugadorLibres = getPlazasJugadorLibres(modoHistoria);
                const jugadorCompleto = plazasJugadorLibres === 0;
                const masterCompleto = mastersActuales >= MAX_MASTER_ROL;
                const personajesAsignados = modoHistoria.personajes
                  .map(personaje => personaje.nombre ?? personaje.usuarioNombre)
                  .filter((nombre): nombre is string => Boolean(nombre?.trim()));
                const misionesTotales = modoHistoria.misiones.length;

                return (
                  <div
                    key={modoHistoria.id}
                    className="jg-card jg-card-modo-historia"
                    style={{ animationDelay: `${i * 0.08}s` }}
                    onClick={() => handleSeleccionModoHistoria(modoHistoria)}
                  >
                    {modoHistoria.nivelAcceso && (
                      <span className="jg-card-premium-chip">Plan {NOMBRE_PARA_NIVEL[modoHistoria.nivelAcceso]}</span>
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
                        <div className="jg-card-footer-row jg-card-footer-row--top">
                          <span className="jg-card-master jg-master-accent">⚔ {modoHistoria.master?.nombre ?? 'Sin master'}</span>
                          <div className="jg-card-personajes-asignados" aria-label="Personajes asignados al modo">
                            {personajesAsignados.length > 0 ? (
                              personajesAsignados.map((nombre, index) => (
                                <span key={`${modoHistoria.id}-personaje-${index}`} className="jg-card-personaje-nombre">
                                  {nombre}
                                  {index < personajesAsignados.length - 1 && (
                                    <span className="jg-card-personaje-separador" aria-hidden="true">•</span>
                                  )}
                                </span>
                              ))
                            ) : (
                              <span className="jg-card-personaje-nombre jg-card-personaje-vacio">Sin personajes</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="jg-card-modo-meta">
                        <div className="jg-card-footer-row jg-card-footer-row--bottom">
                          <span className="jg-card-modo-nivel">Nv. mín. {modoHistoria.nivelMinimo}</span>
                          <div className="jg-card-plazas-roles jg-card-plazas-roles--meta" aria-label="Plazas por rol">
                            <span className="jg-card-plazas">
                              <span className="jg-card-plazas-label">Personajes</span>
                              <span className={`jg-card-plazas-cupo ${jugadorCompleto ? 'completa' : 'disponible'}`}>
                                {jugadoresActuales}/{MAX_JUGADORES_ROL}
                              </span>
                            </span>
                            <span className="jg-card-plazas-separador" aria-hidden="true">||</span>
                            <span className="jg-card-plazas">
                              <span className="jg-card-plazas-label">Master</span>
                              <span className={`jg-card-plazas-cupo ${masterCompleto ? 'completa' : 'disponible'}`}>
                                {mastersActuales}/{MAX_MASTER_ROL}
                              </span>
                            </span>
                          </div>
                        </div>
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

      </div>

      {/* MODALES */}
      {modoHistoriaSeleccionado && (
        <ModalModoHistoria
          modoHistoria={modoHistoriaSeleccionado}
          onClose={() => setModoHistoriaSeleccionado(null)}
          onEntrarModoHistoria={handleEntrarModoHistoria}
        />
      )}
      {modoBloqueadoSeleccionado && (
        <ModalSuscripcionRequerida
          nivelRequerido={modoBloqueadoSeleccionado.nivelRequerido}
          nombreModo={modoBloqueadoSeleccionado.nombre}
          onClose={() => setModoBloqueadoSeleccionado(null)}
          onIrASuscripciones={handleIrASuscripciones}
        />
      )}
    </div>
  );
}