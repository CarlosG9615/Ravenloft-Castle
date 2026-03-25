import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Characters.css';
import { BackButton } from '../../components/BackButton/BackButton';

// Cuando conectes el backend, aquí vendrán los personajes del usuario
const mockPersonajes = [
  // { id: 1, nombre: 'Zara', raza: 'Tiefling', clase: 'Mago', nivel: 3, avatar: 'TieflingMago' },
];

export function CharactersList() {
  const navigate = useNavigate();

  return (
    <div className="characters-page">
      <BackButton />
      <div className="container-xl py-5">

        {/* CABECERA */}
        <div className="d-flex align-items-center justify-content-between mb-5">
          <h1 className="characters-title mb-0">📜 Mis Personajes</h1>
          <button
            className="btn characters-btn-primary px-4"
            onClick={() => navigate('/characters/new')}
          >
            + Crear Personaje
          </button>
        </div>

        <div className="row g-4">

          {mockPersonajes.length === 0 ? (

            /* ESTADO VACÍO */
            <div className="col-12">
              <div className="characters-empty">
                <div className="characters-empty-icon">⚔</div>
                <h3 className="characters-empty-title">No tienes personajes aún</h3>
                <p className="characters-empty-desc">
                  Crea tu primer aventurero y comienza tu leyenda.
                </p>
                <button
                  className="btn characters-btn-primary px-5 mt-2"
                  onClick={() => navigate('/characters/new')}
                >
                  ✦ Crear mi primer personaje
                </button>
              </div>
            </div>

          ) : (

            /* CARDS DE PERSONAJES */
            <>
              {mockPersonajes.map((p: any) => (
                <div className="col-sm-6 col-md-4 col-lg-3" key={p.id}>
                  <div
                    className="character-card"
                    onClick={() => navigate(`/characters/${p.id}`)}
                  >
                    <img
                      src={`/images/avatars/${p.avatar}.png`}
                      alt={p.nombre}
                      className="character-card-img"
                    />
                    <div className="character-card-info">
                      <h5>{p.nombre}</h5>
                      <p>{p.raza} · {p.clase} · Nv.{p.nivel}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* CARD AÑADIR */}
              <div className="col-sm-6 col-md-4 col-lg-3">
                <div
                  className="character-card character-card-add"
                  onClick={() => navigate('/characters/new')}
                >
                  <span className="character-card-add-icon">+</span>
                  <span className="character-card-add-text">Nuevo Personaje</span>
                </div>
              </div>
            </>

          )}

        </div>
      </div>
    </div>
  );
}