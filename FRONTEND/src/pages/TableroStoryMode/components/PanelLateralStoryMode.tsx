import { useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '../../../utils/imageUtils';

interface ModoHistoria {
  nombre?: string | null;
}

interface MisionStoryMode {
  id?: string | number | null;
  nombre?: string | null;
  descripcion?: string | null;
  dificultad?: string | null;
  xpRecompensa?: number | null;
}

interface PersonajeStoryMode {
  avatar?: string | null;
  nombre?: string | null;
  nivel?: number | null;
}

interface Props {
  modoHistoria: ModoHistoria | null;
  mision: MisionStoryMode | null;
  personaje: PersonajeStoryMode | null;
  abierto: boolean;
  onToggle: () => void;
}

const ALIADOS_DEMO = [
  { id: 'a1', nombre: 'Aliado 1', nivel: '-', avatar: null as string | null, colorClass: 'tsm-personaje-avatar--blue' },
  { id: 'a2', nombre: 'Aliado 2', nivel: '-', avatar: null as string | null, colorClass: 'tsm-personaje-avatar--yellow' },
  { id: 'a3', nombre: 'Aliado 3', nivel: '-', avatar: null as string | null, colorClass: 'tsm-personaje-avatar--green' },
];

const resolveAvatarUrl = (avatar: string | undefined | null): string => {
  if (!avatar) return '/images/avatars/default.png';
  if (/^https?:\/\//i.test(avatar) || /^data:/i.test(avatar) || avatar.startsWith('/')) return avatar;
  return getAvatarUrl(avatar);
};

export function PanelLateralStoryMode({ modoHistoria, mision, personaje, abierto, onToggle }: Props) {
  const navigate = useNavigate();

  return (
    <div className={`tb-panel ${abierto ? 'abierto' : ''}`}>
      <button className="tb-panel-toggle" onClick={onToggle}>
        {abierto ? '◀' : '▶'}
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
                alt={personaje.nombre ?? 'Personaje'}
                className="tsm-personaje-avatar tsm-personaje-avatar--red"
              />
              <div className="tsm-personaje-info">
                <p className="tsm-info-nombre">{personaje.nombre}</p>
                <p className="tsm-info-sub">Nivel {personaje.nivel ?? '-'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="tb-seccion">
          <span className="tb-seccion-label">Aliados</span>
          <div className="tsm-aliados-stack">
            {ALIADOS_DEMO.map((aliado) => (
              <div key={aliado.id} className="tsm-personaje-row">
                <img
                  src={resolveAvatarUrl(aliado.avatar)}
                  alt={aliado.nombre}
                  className={`tsm-personaje-avatar ${aliado.colorClass}`}
                />
                <div className="tsm-personaje-info">
                  <p className="tsm-info-nombre">{aliado.nombre}</p>
                  <p className="tsm-info-sub">Nivel {aliado.nivel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="tb-btn-salir" onClick={() => navigate(-1)}>← Salir</button>
      </div>
    </div>
  );
}