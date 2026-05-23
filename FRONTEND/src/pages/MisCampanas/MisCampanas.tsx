import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMisCampanas } from '../../services/campanaService';
import { getCampanaUrl } from '../../utils/imageUtils';
import { useAccessibility } from '../../services/AccessibilityContext';
import { useAuth } from '../../services/AuthContext';
import './MisCampanas.css';

const CARDS_POR_PAGINA = 2;

export function MisCampanas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campanas, setCampanas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<any | null>(null);
  const { enabled: accessibilityEnabled } = useAccessibility();

  useEffect(() => {
    getMisCampanas()
      .then(data => setCampanas(data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { setPagina(1); }, [accessibilityEnabled]);

  const totalPaginas = Math.ceil(campanas.length / CARDS_POR_PAGINA);
  const campanasMostradas = accessibilityEnabled
    ? campanas.slice((pagina - 1) * CARDS_POR_PAGINA, pagina * CARDS_POR_PAGINA)
    : campanas;

  const entrarAlTablero = (c: any) => {
    navigate('/tablero', {
      state: {
        campanaId: c.id,
        campaaNombre: c.nombre,
        mapaUrl: '/images/mapas/bosque/caminoForestal.jpg',
        jugadores: [],
        esMaster: true,
        jugadorActual: { id: user?.id, nombre: user?.nombre },
        masterNombre: user?.nombre || 'Master',
      }
    });
  };

  return (
    <div className="mc-page">
      <div className="mc-contenido">
        <div className="mc-seccion-titulo-wrap">
          <div className="mc-seccion-titulo-top">
            <div className="mc-seccion-titulo">Mis Campañas</div>
            <button
              type="button"
              className="mc-btn-nueva"
              onClick={() => navigate('/create')}
            >
              + Nueva Campaña
            </button>
          </div>
          <div className="mc-seccion-titulo-linea" />
        </div>

        {cargando && <p className="mc-cargando">Cargando campañas...</p>}

        {!cargando && campanas.length === 0 && (
          <div className="mc-vacio">
            <p>No tienes campañas todavía.</p>
            <button className="mc-btn-nueva" onClick={() => navigate('/create')}>
              Crear mi primera campaña
            </button>
          </div>
        )}

        <div className="mc-grid">
          {campanasMostradas.map(c => (
            <div key={c.id} className="mc-card" onClick={() => setCampanaSeleccionada(c)}>
              <div className="mc-card-imagen">
                {getCampanaUrl(c.nombre)
                  ? <img src={getCampanaUrl(c.nombre)} alt={c.nombre} />
                  : <div className="mc-card-imagen-placeholder">⚔</div>
                }
                <span className={`mc-card-estado mc-card-estado--${c.estado?.toLowerCase()}`}>
                  {c.estado}
                </span>
              </div>
              <div className="mc-card-info">
                <h3 className="mc-card-nombre">{c.nombre}</h3>
                {c.descripcion && (
                  <p className="mc-card-desc">{c.descripcion}</p>
                )}
                <div className="mc-card-meta">
                  <span>👥 {c.maxJugadores} jugadores</span>
                  <span>📅 {c.numSesiones} sesiones</span>
                  {c.dificultad && <span>⚡ {c.dificultad}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {accessibilityEnabled && totalPaginas > 1 && (
          <div className="mc-paginacion">
            <button className="mc-pag-btn" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>← Anterior</button>
            <span className="mc-pag-info">Página {pagina} de {totalPaginas}</span>
            <button className="mc-pag-btn" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>Siguiente →</button>
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE CAMPAÑA ── */}
      {campanaSeleccionada && (
        <div className="mc-modal-overlay" onClick={() => setCampanaSeleccionada(null)}>
          <div className="mc-modal" onClick={e => e.stopPropagation()}>

            <div className="mc-modal-hero">
              {getCampanaUrl(campanaSeleccionada.nombre)
                ? <img src={getCampanaUrl(campanaSeleccionada.nombre)} alt={campanaSeleccionada.nombre} className="mc-modal-hero-img" />
                : <div className="mc-modal-hero-placeholder">⚔</div>
              }
              <div className="mc-modal-hero-overlay" />
              <button className="mc-modal-close" onClick={() => setCampanaSeleccionada(null)}>✕</button>
              <div className="mc-modal-hero-info">
                {campanaSeleccionada.dificultad && (
                  <span className="mc-modal-dificultad">{campanaSeleccionada.dificultad}</span>
                )}
                <h2 className="mc-modal-titulo">{campanaSeleccionada.nombre}</h2>
                <p className="mc-modal-sistema">{campanaSeleccionada.sistema || 'D&D 5e'}</p>
              </div>
            </div>

            <div className="mc-modal-body">
              <div className="mc-modal-stats">
                <div className="mc-modal-stat">
                  <span className="mc-modal-stat-label">Master</span>
                  <span className="mc-modal-stat-valor">👑 {user?.nombre || 'Tú'}</span>
                </div>
                <div className="mc-modal-stat">
                  <span className="mc-modal-stat-label">Sesiones</span>
                  <span className="mc-modal-stat-valor">📅 {campanaSeleccionada.numSesiones || 0}</span>
                </div>
                <div className="mc-modal-stat">
                  <span className="mc-modal-stat-label">Jugadores</span>
                  <span className="mc-modal-stat-valor">👥 {campanaSeleccionada.maxJugadores} máx.</span>
                </div>
                <div className="mc-modal-stat">
                  <span className="mc-modal-stat-label">Estado</span>
                  <span className="mc-modal-stat-valor mc-estado-abierta">{campanaSeleccionada.estado || 'Abierta'}</span>
                </div>
              </div>

              {campanaSeleccionada.descripcion && (
                <div className="mc-modal-seccion">
                  <h4 className="mc-modal-seccion-titulo">Historia de la Campaña</h4>
                  <p className="mc-modal-texto">{campanaSeleccionada.descripcion}</p>
                </div>
              )}

              <div className="mc-modal-acciones">
                <button
                  className="mc-btn-liderar"
                  onClick={() => entrarAlTablero(campanaSeleccionada)}
                >
                  👑 Liderar la campaña
                </button>
                <button
                  className="mc-btn-editar"
                  onClick={() => navigate(`/create?edit=${campanaSeleccionada.id}`)}
                >
                  ✏ Editar campaña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
