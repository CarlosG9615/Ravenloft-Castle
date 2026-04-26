import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PanelPartida } from '../Tablero/PanelPartida';
import { getAvatarUrl } from '../../utils/imageUtils';
import './TableroStoryMode.css';

const resolveAvatarUrl = (avatar: string | undefined): string => {
  if (!avatar) return '/images/avatars/default.png';
  if (/^https?:\/\//i.test(avatar) || /^data:/i.test(avatar)) return avatar;
  return getAvatarUrl(avatar);
};

export function TableroStoryMode() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as any) ?? {};
  const modoHistoria = state.modoHistoria ?? null;
  const mision = state.mision ?? null;
  const personaje = state.personaje ?? null;

  const [panelAbierto, setPanelAbierto] = useState(true);

  return (
    <div className="tb-page tsm-page">

      {/* PANEL LATERAL IZQUIERDO */}
      <div className={`tb-panel ${panelAbierto ? 'abierto' : ''}`}>
        <button className="tb-panel-toggle" onClick={() => setPanelAbierto(!panelAbierto)}>
          {panelAbierto ? '◀' : '▶'}
        </button>

        <div className="tb-panel-contenido">
          <h3 className="tb-panel-titulo">⚔ Modo Historia</h3>
          {modoHistoria?.nombre && (
            <p className="tb-campana-nombre">{modoHistoria.nombre}</p>
          )}

          {mision && (
            <div className="tb-seccion">
              <span className="tb-seccion-label">Misión activa</span>
              <p className="tsm-info-nombre">{mision.nombre ?? `Misión ${mision.id ?? '-'}`}</p>
              {mision.descripcion && (
                <p className="tsm-info-desc">{mision.descripcion}</p>
              )}
              {mision.dificultad && (
                <p className="tsm-info-sub">Dificultad: {mision.dificultad}</p>
              )}
              {mision.xpRecompensa != null && (
                <p className="tsm-info-sub">XP: {mision.xpRecompensa}</p>
              )}
            </div>
          )}

          {personaje && (
            <div className="tb-seccion">
              <span className="tb-seccion-label">Tu personaje</span>
              <div className="tsm-personaje-row">
                <img
                  src={resolveAvatarUrl(personaje.avatar)}
                  alt={personaje.nombre}
                  className="tsm-personaje-avatar"
                />
                <div className="tsm-personaje-info">
                  <p className="tsm-info-nombre">{personaje.nombre}</p>
                  <p className="tsm-info-sub">Nivel {personaje.nivel ?? '-'}</p>
                </div>
              </div>
            </div>
          )}

          <button className="tb-btn-salir" onClick={() => navigate(-1)}>← Salir</button>
        </div>
      </div>

      {/* ÁREA CENTRAL */}
      <div className="tsm-center" aria-label="Tablero del modo historia">
        <img
          src="/images/tableros/tableroModHistoria1.png"
          alt="Tablero del modo historia 1"
          className="tsm-center-image"
        />
      </div>

      {/* PANEL DERECHO */}
      <PanelPartida nombreMaster={personaje?.nombre ?? 'Personaje'} />
    </div>
  );
}
