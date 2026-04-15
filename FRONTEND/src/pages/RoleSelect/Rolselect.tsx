import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Rolselect.css';

export function RoleSelect() {
  const navigate = useNavigate();
  const [hover, setHover] = useState<'jugador' | 'master' | null>(null);

  return (
    <div className="rs-page">
      {/* FONDO CON PARTÍCULAS */}
      <div className="rs-bg" />
      <div className="rs-vignette" />

      {/* CABECERA */}
      <div className="rs-header">
        <div className="rs-linea-decorativa" />
        <h1 className="rs-titulo">¿Cuál es tu destino?</h1>
        <p className="rs-subtitulo">Elige tu camino en RavenLoft Castle</p>
        <div className="rs-linea-decorativa" />
      </div>

      {/* CARDS DE ROL */}
      <div className="rs-opciones">

        {/* JUGADOR */}
        <div
          className={`rs-card rs-card--jugador ${hover === 'jugador' ? 'activa' : ''} ${hover === 'master' ? 'inactiva' : ''}`}
          onMouseEnter={() => setHover('jugador')}
          onMouseLeave={() => setHover(null)}
          onClick={() => navigate('/characters/new')}
        >
          <div className="rs-card-brillo" />
          <div className="rs-card-borde" />

          <div className="rs-mascota-wrap">
            <img
              src="public/images/RoloPlayer.png"
              alt="Jugador"
              className="rs-mascota"
            />
            <div className="rs-mascota-sombra" />
          </div>

          <div className="rs-card-info">
          
            <h2 className="rs-rol-titulo">Jugador</h2>
            <p className="rs-rol-desc">
              Crea tu personaje, únete a una campaña y forja tu leyenda en los reinos de RavenLoft.
            </p>
            <button className="rs-btn rs-btn--jugador">
              Comenzar como Jugador
              <span className="rs-btn-arrow">→</span>
            </button>
          </div>

          <div className="rs-card-tag">AVENTURERO</div>
        </div>

        {/* SEPARADOR */}
        <div className="rs-separador">
          <div className="rs-sep-linea" />
          <span className="rs-sep-texto">o</span>
          <div className="rs-sep-linea" />
        </div>

        {/* MASTER */}
        <div
          className={`rs-card rs-card--master ${hover === 'master' ? 'activa' : ''} ${hover === 'jugador' ? 'inactiva' : ''}`}
          onMouseEnter={() => setHover('master')}
          onMouseLeave={() => setHover(null)}
          onClick={() => navigate('/create')}
        >
          <div className="rs-card-brillo rs-card-brillo--master" />
          <div className="rs-card-borde rs-card-borde--master" />

          <div className="rs-mascota-wrap">
            <img
              src="public/images/RoloMaster.png"
              alt="Master"
              className="rs-mascota"
            />
            <div className="rs-mascota-sombra rs-mascota-sombra--master" />
          </div>

          <div className="rs-card-info">
            
            <h2 className="rs-rol-titulo">Master</h2>
            <p className="rs-rol-desc">
              Diseña mundos, crea campañas épicas y guía a tus jugadores a través de aventuras inolvidables.
            </p>
            <button className="rs-btn rs-btn--master">
              Comenzar como Master
              <span className="rs-btn-arrow">→</span>
            </button>
          </div>

          <div className="rs-card-tag rs-card-tag--master">DUNGEON MASTER</div>
        </div>

      </div>

      {/* FOOTER DECORATIVO */}
      <div className="rs-footer">
        <p className="rs-footer-texto">Tu aventura te espera</p>
        <div className="rs-footer-ornamento">⚜</div>
      </div>
    </div>
  );
}