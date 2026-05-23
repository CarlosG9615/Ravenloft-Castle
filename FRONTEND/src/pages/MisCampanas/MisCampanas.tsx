import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMisCampanas, eliminarCampana } from '../../services/campanaService';
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
  const [campanaABorrar, setCampanaABorrar] = useState<any | null>(null);
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

  const getImagenSrc = (c: any) =>
    c.imagen?.startsWith('http') ? c.imagen : getCampanaUrl(c.nombre);

  const confirmarEliminar = async () => {
    if (!campanaABorrar) return;
    try {
      await eliminarCampana(campanaABorrar.id);
      setCampanas(prev => prev.filter(camp => camp.id !== campanaABorrar.id));
      setCampanaSeleccionada(null);
    } catch {
      // no-op, modal se cierra igualmente
    } finally {
      setCampanaABorrar(null);
    }
  };

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
                <img
                  src={getImagenSrc(c)}
                  alt={c.nombre}
                  onError={e => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    target.nextElementSibling?.removeAttribute('style');
                  }}
                />
                <div className="mc-card-imagen-placeholder" style={{ display: 'none' }}>⚔</div>
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
              <img
                src={getImagenSrc(campanaSeleccionada)}
                alt={campanaSeleccionada.nombre}
                className="mc-modal-hero-img"
                onError={e => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  target.nextElementSibling?.removeAttribute('style');
                }}
              />
              <div className="mc-modal-hero-placeholder" style={{ display: 'none' }}>⚔</div>
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
                   Liderar la campaña
                </button>
                <button
                  className="mc-btn-editar"
                  onClick={() => navigate(`/create?edit=${campanaSeleccionada.id}`)}
                >
                   Editar campaña
                </button>
                {campanaSeleccionada.masterId === user?.id && (
                  <button
                    className="mc-btn-borrar"
                    onClick={() => setCampanaABorrar(campanaSeleccionada)}
                  >
                     Borrar campaña
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMACIÓN BORRADO ── */}
      {campanaABorrar && (
        <div className="mc-confirm-overlay" onClick={() => setCampanaABorrar(null)}>
          <div className="mc-confirm" onClick={e => e.stopPropagation()}>
            <p className="mc-confirm-titulo">¿Borrar campaña?</p>
            <p className="mc-confirm-texto">
              Se eliminará <strong>"{campanaABorrar.nombre}"</strong> de forma permanente. Esta acción no se puede deshacer.
            </p>
            <div className="mc-confirm-acciones">
              <button className="mc-confirm-btn-cancelar" onClick={() => setCampanaABorrar(null)}>
                Cancelar
              </button>
              <button className="mc-confirm-btn-borrar" onClick={confirmarEliminar}>
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
