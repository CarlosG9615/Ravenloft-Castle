import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPersonajes } from '../../services/personajeService';
import { getAvatarUrl } from '../../utils/imageUtils';
import { useAccessibility } from '../../services/AccessibilityContext';
import './MisPersonajes.css';

const CARDS_POR_PAGINA = 2;

const isAbsoluteUrl = (v: string) => /^https?:\/\//i.test(v);
const isDataUrl = (v: string) => /^data:/i.test(v);

const resolveAvatarUrl = (avatar?: string | null): string => {
  if (!avatar) return '/images/avatars/default.png';
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar)) return avatar;
  return getAvatarUrl(avatar);
};

interface PersonajeDTO {
  id: number;
  nombre: string;
  raza: string;
  clase: string;
  nivel: number;
  avatar?: string | null;
}

export function MisPersonajes() {
  const navigate = useNavigate();
  const [personajes, setPersonajes] = useState<PersonajeDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const { enabled: accessibilityEnabled } = useAccessibility();

  useEffect(() => {
    getPersonajes()
      .then(data => setPersonajes(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { setPagina(1); }, [accessibilityEnabled]);

  const totalPaginas = Math.ceil(personajes.length / CARDS_POR_PAGINA);
  const personajesMostrados = accessibilityEnabled
    ? personajes.slice((pagina - 1) * CARDS_POR_PAGINA, pagina * CARDS_POR_PAGINA)
    : personajes;

  return (
    <div className="mp-page">
      <div className="mp-contenido">
        <div className="mp-seccion-titulo-wrap">
          <div className="mp-seccion-titulo-top">
            <div className="mp-seccion-titulo">Mis Personajes</div>
            <button
              type="button"
              className="mp-btn-nueva"
              onClick={() => navigate('/characters/new')}
            >
              + Nuevo Personaje
            </button>
          </div>
          <div className="mp-seccion-titulo-linea" />
        </div>

        {cargando && <p className="mp-cargando">Cargando personajes...</p>}

        {!cargando && personajes.length === 0 && (
          <div className="mp-vacio">
            <p>No tienes personajes todavía.</p>
            <button className="mp-btn-nueva" onClick={() => navigate('/characters/new')}>
              Crear mi primer personaje
            </button>
          </div>
        )}

        <div className="mp-grid">
          {personajesMostrados.map(p => (
            <div
              key={p.id}
              className="mp-card"
              onClick={() => navigate(`/characters/${p.id}`)}
            >
              <img
                src={resolveAvatarUrl(p.avatar)}
                alt={p.nombre}
                className="mp-card-img"
                loading="lazy"
              />
              <div className="mp-card-info">
                <h5 className="mp-card-nombre">{p.nombre}</h5>
                <p className="mp-card-sub">{p.raza} · {p.clase} · Nv.{p.nivel}</p>
              </div>
            </div>
          ))}

        </div>

        {accessibilityEnabled && totalPaginas > 1 && (
          <div className="mp-paginacion">
            <button className="mp-pag-btn" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>← Anterior</button>
            <span className="mp-pag-info">Página {pagina} de {totalPaginas}</span>
            <button className="mp-pag-btn" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}
