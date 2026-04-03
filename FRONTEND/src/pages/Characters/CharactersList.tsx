import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Characters.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { getPersonajes } from '../../services/personajeService';
import { getCartaUrl } from '../../utils/imageUtils';

interface PersonajeDTO {
  id: number;
  nombre: string;
  raza: string;
  clase: string;
  nivel: number;
  avatar?: string | null;
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const isDataUrl = (value: string) => /^data:/i.test(value);

const resolveAvatarUrl = (avatar?: string | null): string => {
  if (!avatar) return '/images/avatars/default.png';
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar)) return avatar;
  return getCartaUrl(avatar);
};

export function CharactersList() {
  const navigate = useNavigate();
  const [personajes, setPersonajes] = useState<PersonajeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPersonajes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPersonajes();
        setPersonajes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando personajes:', err);
        setError('No se pudieron cargar tus personajes. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadPersonajes();
  }, []);

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

          {loading && (
            <div className="col-12">
              <div className="characters-empty">
                <h3 className="characters-empty-title">Cargando personajes...</h3>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="col-12">
              <div className="characters-empty">
                <h3 className="characters-empty-title">Error al cargar</h3>
                <p className="characters-empty-desc">{error}</p>
                <button
                  className="btn characters-btn-primary px-5 mt-2"
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!loading && !error && personajes.length === 0 ? (

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

          ) : !loading && !error ? (

            /* CARDS DE PERSONAJES */
            <>
              {personajes.map((p) => (
                <div className="col-sm-6 col-md-4 col-lg-3" key={p.id}>
                  <div
                    className="character-card"
                    onClick={() => navigate(`/characters/${p.id}`)}
                  >
                    <img
                      src={resolveAvatarUrl(p.avatar)}
                      alt={p.nombre}
                      className="character-card-img"
                      loading="lazy"
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

          ) : null}

        </div>
      </div>
    </div>
  );
}