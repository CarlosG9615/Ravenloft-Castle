import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMisCampanas } from '../../services/campanaService';
import './MisCampanas.css';

export function MisCampanas() {
  const navigate = useNavigate();
  const [campanas, setCampanas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getMisCampanas()
      .then(data => setCampanas(data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="mc-page">
      <div className="mc-header">
        <h1 className="mc-titulo">Mis Campañas</h1>
        <button className="mc-btn-crear" onClick={() => navigate('/create')}>
          + Nueva Campaña
        </button>
      </div>

      {cargando && <p className="mc-cargando">Cargando campañas...</p>}

      {!cargando && campanas.length === 0 && (
        <div className="mc-vacio">
          <p>No tienes campañas todavía.</p>
          <button className="mc-btn-crear" onClick={() => navigate('/create')}>
            Crear mi primera campaña
          </button>
        </div>
      )}

      <div className="mc-grid">
        {campanas.map(c => (
          <div key={c.id} className="mc-card" onClick={() => navigate(`/campana/${c.id}`)}>
            <div className="mc-card-imagen">
              {c.imagen
                ? <img src={c.imagen} alt={c.nombre} />
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
    </div>
  );
}