import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Characters.css';

const avatars = [
  'BardoHumano',
  'BardoHumanoFemale',
  'Bruja',
  'brujoEnano',
  'brujoMayor',
  'ClerigoFemale',
  'clerigoHumano',
  'ClerigoMale',
  'ClerigoSemiElfo',
  'ClerigoSemiElfoFemale',
  'elfoBardo',
  'enano',
  'enanoBrujoFemale',
  'enanoGuerrera',
  'enanoMago',
  'enanoMonje',
  'eneanoGuerreroMale',
  'GuerreroElfo',
  'HumanoBardo',
  'HumanoGuerreroFemale',
  'KenkuPicaro',
  'MayorMago',
  'MonjeElfo',
  'picaro',
  'picaroHumano',
  'Rnahumanoide',
  'SkavenHumanoideMago',
  'TabaxiMago',
  'TabaxiMonje',
  'TieflingFemale',
  'TieflingGuerrero',
  'TieflingMago',
  'tieflingMonjeFemale',
  'tieflingPicaro',
  'tipodeEnano',
  'tipoMonje',
];

export function Characters() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState<string>(avatars[0]);

  return (
    <div className="characters-page">
      <div className="container-xl py-5">

        {/* TÍTULO */}
        <h1 className="characters-title text-center mb-5">
          ⚔ Selecciona tu Aventurero
        </h1>

        <div className="row g-4 align-items-start">

          {/* GRID DE AVATARES */}
          <div className="col-lg-8">
            <div className="avatars-grid">
              {avatars.map((avatar) => (
                <div
                  key={avatar}
                  className={`avatar-thumb ${selected === avatar ? 'selected' : ''}`}
                  onClick={() => setSelected(avatar)}
                >
                  <img
                    src={`/images/avatars/${avatar}.png`}
                    alt={avatar}
                    className="avatar-thumb-img"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW DERECHA */}
          <div className="col-lg-4">
            <div className="avatar-preview-card">

              {/* IMAGEN GRANDE */}
              <div className="avatar-preview-img-wrap">
                <img
                  src={`/images/avatars/${selected}.png`}
                  alt={selected}
                  className="avatar-preview-img"
                />
              </div>

              {/* NOMBRE */}
              <h3 className="avatar-preview-name">{selected}</h3>

              {/* BOTONES */}
              <div className="d-flex flex-column gap-3 mt-4">
                <button
                  className="btn characters-btn-primary"
                  onClick={() => {
                      const state = location.state as any;
                      // aquí guardas todo junto con el avatar
                      navigate('/characters/list');
                    }}
                >
                  ✦ Crear Personaje
                </button>
                <button
                  className="btn characters-btn-secondary"
                  onClick={() => navigate('/characters/new', { state: { avatar: null } })}
                >
                  Subir mi propia imagen
                </button>
              </div>

            </div>
          </div>
        </div>

      

            {/* Aquí se mapearán los personajes del usuario cuando vengan del backend */}
            {/* Ejemplo de card de personaje:
            <div className="col-sm-6 col-md-4 col-lg-3">
              <div className="character-card" onClick={() => navigate('/characters/1')}>
                <img src="/images/avatars/TieflingMago.png" className="character-card-img" />
                <div className="character-card-info">
                  <h5>Zara</h5>
                  <p>Tiefling · Mago · Nv.3</p>
                </div>
              </div>
            </div>
            */}


      </div>
    </div>
  );
}