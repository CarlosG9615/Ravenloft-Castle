import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Characters.css';
import { BackButton } from '../../components/BackButton/BackButton';

export function CharactersMenu() {
  const navigate = useNavigate();

  return (
    <div className="characters-page">
      <BackButton />
      <div className="container py-5">

        <h1 className="characters-title text-center mb-5">
          ⚔ Personajes
        </h1>

        <div className="row g-4 justify-content-center">

          {/* MIS PERSONAJES */}
          <div className="col-md-5">
            <div
              className="menu-card"
              onClick={() => navigate('/characters/list')}
            >
              <div className="menu-card-icon">📜</div>
              <h2 className="menu-card-title">Mis Personajes</h2>
              <p className="menu-card-desc">
                Accede a tus aventureros creados y gestiona sus fichas.
              </p>
            </div>
          </div>

          {/* CREAR PERSONAJE */}
          <div className="col-md-5">
            <div
              className="menu-card"
              onClick={() => navigate('/characters/new')}
            >
              <div className="menu-card-icon">✦</div>
              <h2 className="menu-card-title">Crear Personaje</h2>
              <p className="menu-card-desc">
                Forja un nuevo aventurero y comienza tu leyenda.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}