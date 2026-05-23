import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JoinGame.css';
import { obtenerCampanasActivas, unirseACampana } from '../../services/campanaService';
import { getPersonajes } from '../../services/personajeService';
import { getAvatarUrl, getCampanaUrl, getCartaUrl } from '../../utils/imageUtils';
import { useAuth } from '../../services/AuthContext';
import { useAccessibility } from '../../services/AccessibilityContext';
import { CharacterSelectModal } from '../../components/CharacterSelectModal/CharacterSelectModal';

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

interface Personaje {
  id: number;
  nombre: string;
  avatar?: string;
  nivel?: number;
  statsFinales?: Record<string, number>;
  statsBase?: Record<string, number>;
  [key: string]: unknown;
}

const DIFICULTAD_COLOR: Record<string, string> = {
  'Fácil':   '#2ecc71',
  'Media':   '#f39c12',
  'Difícil': '#e74c3c',
  'Épica':   '#9b59b6',
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const isDataUrl = (value: string) => /^data:/i.test(value);
const isAppPath = (value: string) => value.startsWith('/');

const resolveAvatarUrl = (avatar?: string) => {
  if (!avatar) return '/images/avatars/default.png';
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
  return getCartaUrl(avatar);
};

const resolveAvatarPreviewUrl = (avatar?: string) => {
  if (!avatar) return '/images/avatars/default.png';
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
  return getAvatarUrl(avatar);
};

const STAT_LABELS: Record<string, string> = {
  fuerza: 'Fuerza',
  destreza: 'Destreza',
  constitucion: 'Constitucion',
  inteligencia: 'Inteligencia',
  sabiduria: 'Sabiduria',
  carisma: 'Carisma',
};

const STAT_KEYS = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'] as const;

const getStatValue = (personaje: Personaje | null, statKey: string) => {
  if (!personaje) return '-';
  const desdeFinales = personaje?.statsFinales?.[statKey];
  if (typeof desdeFinales === 'number') return desdeFinales;
  const desdeBase = personaje?.statsBase?.[statKey];
  if (typeof desdeBase === 'number') return desdeBase;
  const plano = personaje?.[statKey];
  if (typeof plano === 'number') return plano;
  return '-';
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

function ModalCampana({
  campana,
  onClose,
  onJoinCampana,
  user
}: {
  campana: Campana;
  onClose: () => void;
  onJoinCampana: (campana: Campana, soyMaster: boolean) => void;
  user: { id?: number; nombre?: string } | null;
}) {
  const plazasLibres = campana.maxJugadores - campana.jugadores.length;
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
          <button type="button" className="jg-modal-close" onClick={e => { e.stopPropagation(); onClose(); }}>✕</button>
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
            onClick={() => onJoinCampana(campana, soyMaster)}
          >
            {soyMaster ? '👑 Liderar la campaña' : (plazasLibres > 0 ? '⚔ Unirme a esta Campaña' : 'Campaña Completa')}
          </button>
        </div>
      </div>
    </div>
  );
}

const CARDS_POR_PAGINA = 2;

export function JoinGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enabled: accessibilityEnabled } = useAccessibility();
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [campanaParaUnirse, setCampanaParaUnirse] = useState<Campana | null>(null);
  const [filtro, setFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [personajesCargando, setPersonajesCargando] = useState(false);
  const [personajesError, setPersonajesError] = useState<string | null>(null);
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState<Personaje | null>(null);
  const [mensajeEspera, setMensajeEspera] = useState(false);

  const statsPersonajeSeleccionado = useMemo(
    () => STAT_KEYS.map(statKey => ({
      key: statKey,
      label: STAT_LABELS[statKey],
      value: getStatValue(personajeSeleccionado, statKey),
    })),
    [personajeSeleccionado]
  );

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
          jugadores: [],
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
    if (!isCharacterModalOpen) return;
    if (personajes.length > 0) return;
    const cargarPersonajes = async () => {
      setPersonajesCargando(true);
      setPersonajesError(null);
      try {
        const data = await getPersonajes();
        setPersonajes(Array.isArray(data) ? data : []);
      } catch (e) {
        setPersonajesError('No se pudieron cargar tus personajes.');
      } finally {
        setPersonajesCargando(false);
      }
    };
    cargarPersonajes();
  }, [isCharacterModalOpen, personajes.length]);

  const campanasFiltradas = campanas.filter(c => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.master.toLowerCase().includes(busqueda.toLowerCase());
  const coincideFiltro = filtro === 'todas' || normalizarDificultad(c.dificultad) === normalizarDificultad(filtro);

  
  // Excluir campañas donde soy master
  const noSoyMaster = c.masterId !== user?.id;
  return coincideBusqueda && coincideFiltro && noSoyMaster;
  });

  useEffect(() => { setPagina(1); }, [filtro, busqueda, accessibilityEnabled]);

  const totalPaginas = Math.ceil(campanasFiltradas.length / CARDS_POR_PAGINA);
  const campanasMostradas = accessibilityEnabled
    ? campanasFiltradas.slice((pagina - 1) * CARDS_POR_PAGINA, pagina * CARDS_POR_PAGINA)
    : campanasFiltradas;

  const abrirSeleccionPersonaje = (campana: Campana) => {
    setCampanaParaUnirse(campana);
    setPersonajeSeleccionado(null);
    setPersonajesError(null);
    setIsCharacterModalOpen(true);
  };

  const cerrarSeleccionPersonaje = () => {
    setIsCharacterModalOpen(false);
    setCampanaParaUnirse(null);
  };

  const crearJugadorBase = (base: { id?: number; nombre?: string; clase?: string; hp?: number; hpMax?: number; avatar?: string }) => ({
    id: base.id ?? user?.id ?? Date.now(),
    usuarioId: user?.id ?? null,
    nombre: base.nombre ?? user?.nombre ?? 'Tu',
    clase: base.clase ?? 'Aventurero',
    hp: base.hp ?? base.hpMax ?? 20,
    hpMax: base.hpMax ?? base.hp ?? 20,
    conectado: true,
    avatar: base.avatar,
  });

  const confirmarUnionConPersonaje = async () => {
    if (!campanaParaUnirse || !personajeSeleccionado) return;

    try {
      await unirseACampana(campanaParaUnirse.id, personajeSeleccionado.id);
    } catch (err) {
      console.error('Error al unirse a la campaña:', err);
    }

    const jugadorRed = crearJugadorBase({
      id: personajeSeleccionado.id,
      nombre: personajeSeleccionado.nombre,
      clase: (personajeSeleccionado as { clase?: string }).clase,
      hp: (personajeSeleccionado as { hp?: number }).hp,
      hpMax: (personajeSeleccionado as { hpMax?: number }).hpMax,
      avatar: personajeSeleccionado.avatar,
    });

    const misJugadores = [...campanaParaUnirse.jugadores, jugadorRed];

    navigate('/tablero', {
      state: {
        campanaId: campanaParaUnirse.id,
        campaaNombre: campanaParaUnirse.nombre,
        mapaUrl: '/images/mapas/bosque/caminoForestal.jpg',
        jugadores: misJugadores,
        esMaster: false,
        jugadorActual: jugadorRed,
        masterNombre: campanaParaUnirse.master,
      },
    });

    cerrarSeleccionPersonaje();
  };

  const handleCambiarVistaHistoria = () => {
    sessionStorage.setItem('storyModeOrigin', '/join');
    navigate('/join/story-mode');
  };

  const handleJoinCampana = async (campana: Campana, soyMaster: boolean) => {
    setCampanaSeleccionada(null);

    if (soyMaster) {
      const jugadorMaster = crearJugadorBase({
        id: user?.id,
        nombre: user?.nombre,
      });
      navigate('/tablero', {
        state: {
          campanaId: campana.id,
          campaaNombre: campana.nombre,
          mapaUrl: '/images/mapas/bosque/caminoForestal.jpg',
          jugadores: campana.jugadores,
          esMaster: true,
          jugadorActual: jugadorMaster,
          masterNombre: user?.nombre || 'Master',
        }
      });
      return;
    }

    // ── Verificar si el master está conectado antes de dejar entrar al jugador ──
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8080/api/campanas/${campana.id}/master-conectado`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const masterOnline = await res.json();
      if (!masterOnline) {
        setMensajeEspera(true);
        return;
      }
    } catch {
      alert('No se pudo verificar el estado de la partida. Inténtalo de nuevo.');
      return;
    }

    abrirSeleccionPersonaje(campana);
  };

  return (
    <div className="jg-page">
      <div className="jg-bg is-campanas" aria-hidden="true">
        <div className="jg-bg-overlay" />
      </div>

      <div className="jg-contenido">
        <div className="jg-header">
          <h1 className="jg-titulo">Unirte a una partida</h1>
          <p className="jg-descripcion">Encuentra tu grupo y forja tu leyenda en RavenLoft Castle</p>
        </div>

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

        <div className="jg-seccion-titulo-wrap" aria-label="CAMPAÑAS">
          <div className="jg-seccion-titulo-top">
            <div className="jg-seccion-titulo">CAMPAÑAS</div>
            <button
              type="button"
              className="jg-modo-historia-btn jg-modo-historia-btn-inline"
              onClick={handleCambiarVistaHistoria}
            >
              <span className="jg-modo-historia-badge">nuevo</span>
              <span className="jg-modo-historia-texto">Modo Historia</span>
            </button>
          </div>
          <div className="jg-seccion-titulo-linea" />
        </div>

        <div className="jg-grid">
          {campanasMostradas.map((campana, i) => {
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
        {accessibilityEnabled && totalPaginas > 1 && (
          <div className="jg-paginacion">
            <button
              className="jg-pag-btn"
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >← Anterior</button>
            <span className="jg-pag-info">Página {pagina} de {totalPaginas}</span>
            <button
              className="jg-pag-btn"
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
            >Siguiente →</button>
          </div>
        )}
        {campanasFiltradas.length === 0 && (
          <div className="jg-vacio">
            <div className="jg-vacio-icon">🗡</div>
            <p>No se encontraron campañas con esos criterios</p>
          </div>
        )}
      </div>

      {campanaSeleccionada && (
        <ModalCampana
          campana={campanaSeleccionada}
          onClose={() => setCampanaSeleccionada(null)}
          onJoinCampana={handleJoinCampana}
          user={user}
        />
      )}
      {mensajeEspera && (
        <div className="jg-modal-overlay" onClick={() => setMensajeEspera(false)}>
          <div className="jg-espera-modal" onClick={e => e.stopPropagation()}>
            <img
              src="/images/roloRuffles.png"
              alt="RoloRuffles"
              className="jg-espera-mascota"
            />
            <h3 className="jg-espera-titulo">¡La partida aún no ha comenzado!</h3>
            <p className="jg-espera-texto">
              Ve a por tus patatas, prepara tus dados y espera a que la partida comience.
            </p>
            <button className="jg-btn-unirse" onClick={() => setMensajeEspera(false)}>
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
      <CharacterSelectModal
        isOpen={isCharacterModalOpen}
        title="Selecciona a tu personaje"
        personajes={personajes}
        loading={personajesCargando}
        error={personajesError}
        selected={personajeSeleccionado}
        onSelect={setPersonajeSeleccionado}
        onClose={cerrarSeleccionPersonaje}
        onConfirm={confirmarUnionConPersonaje}
        confirmLabel="Entrar"
        stats={statsPersonajeSeleccionado}
        getCardImage={(personaje: Personaje) => resolveAvatarUrl(personaje.avatar)}
        getPreviewImage={(personaje: Personaje) => resolveAvatarPreviewUrl(personaje.avatar)}
        emptyMessage="No tienes personajes disponibles."
        previewEmptyMessage="Selecciona un personaje para ver su avatar"
      />
    </div>
  );
}