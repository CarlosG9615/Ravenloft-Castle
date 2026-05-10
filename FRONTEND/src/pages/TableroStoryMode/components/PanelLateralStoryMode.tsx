import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModalAlert } from '../../../components/ModalAlert/ModalAlert';
import { API_URL, authHeaders } from '../../../services/api';
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

interface Aliado {
  id?: string | number;
  personajeId?: string | number;
  nombre: string;
  nivel?: number | null;
  avatar?: string | null;
  color?: string;
  conectado?: boolean;
  clase?: string;
}

interface ParticipanteInfo {
  personajeId: number;
  nombrePersonaje: string;
  nombreUsuario: string;
  avatar?: string | null;
  nivel?: number | null;
  ordenUnion?: number;
}

interface Props {
  modoHistoria: ModoHistoria | null;
  mision: MisionStoryMode | null;
  personaje: PersonajeStoryMode | null;
  jugadoresSincronizados?: Aliado[];
  jugadorActual?: any;
  participantes?: ParticipanteInfo[];
  abierto: boolean;
  onToggle: () => void;
  onAbandonarConfirmado?: (nombrePersonaje: string) => void;
}

const ORDER_COLORS = ['#C0392B', '#2980B9', '#F39C12', '#27AE60'];
const resolveAvatarUrl = (avatar: string | undefined | null): string => {
  if (!avatar) return '/images/avatars/default.png';
  if (/^https?:\/\//i.test(avatar) || /^data:/i.test(avatar) || avatar.startsWith('/')) return avatar;
  if (!avatar.endsWith('.png')) return getAvatarUrl(avatar);
  return avatar;
};

export function PanelLateralStoryMode({
  modoHistoria,
  mision,
  personaje,
  jugadoresSincronizados = [],
  jugadorActual = null,
  participantes = [],
  abierto,
  onToggle,
  onAbandonarConfirmado,
}: Props) {
  const navigate = useNavigate();
  const [showAbandonarMisionModal, setShowAbandonarMisionModal] = useState(false);
  const [abandonandoMision, setAbandonandoMision] = useState(false);

  const misionId = mision?.id ?? null;
  const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? personaje?.nivel ?? null;

  const getColorByOrden = (ordenUnion?: number | null): string => {
    if (ordenUnion === null || ordenUnion === undefined || Number.isNaN(Number(ordenUnion))) {
      return ORDER_COLORS[0];
    }
    return ORDER_COLORS[Number(ordenUnion)] ?? ORDER_COLORS[0];
  };

  const getParticipanteByPersonajeId = (id: string | number | null | undefined): ParticipanteInfo | undefined => {
    if (id === null || id === undefined) return undefined;
    return participantes.find((p) => String(p.personajeId) === String(id));
  };

  const getOrdenFromParticipante = (participante?: ParticipanteInfo | undefined): number | null => {
    if (participante?.ordenUnion === null || participante?.ordenUnion === undefined) return null;
    return Number.isNaN(Number(participante.ordenUnion)) ? null : Number(participante.ordenUnion);
  };

  const participantesOrdenados = [...participantes]
    .filter((p) => p.personajeId !== null && p.personajeId !== undefined)
    .sort((a, b) => {
      const ordenA = getOrdenFromParticipante(a);
      const ordenB = getOrdenFromParticipante(b);

      if (ordenA === null && ordenB === null) return String(a.personajeId).localeCompare(String(b.personajeId));
      if (ordenA === null) return 1;
      if (ordenB === null) return -1;
      return ordenA - ordenB;
    });

  const aliadosAMostrar = participantesOrdenados.filter((participante) => {
    const miParticipante = getParticipanteByPersonajeId(jugadorActual?.personajeId ?? jugadorActual?.id ?? personajeId);
    if (!miParticipante) return true;
    return String(participante.personajeId) !== String(miParticipante.personajeId);
  });

  const aliadoConectado = (participante: ParticipanteInfo): boolean => {
    const syncMatch = jugadoresSincronizados.find((jugador) => {
      const jugadorPersonajeId = jugador?.personajeId ?? jugador?.id;
      return jugadorPersonajeId !== null && jugadorPersonajeId !== undefined && String(jugadorPersonajeId) === String(participante.personajeId);
    });
    return syncMatch?.conectado !== false;
  };

  const abandonarMision = async () => {
    if (!misionId || !personajeId) return;

    setAbandonandoMision(true);
    setShowAbandonarMisionModal(false);

    try {
      const response = await fetch(
        `${API_URL}/api/misiones/${misionId}/participantes/by-personaje/${personajeId}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
        }
      );

      if (!response.ok && response.status !== 404) {
        return;
      }

      onAbandonarConfirmado?.(personaje?.nombre ?? jugadorActual?.nombre ?? 'Personaje');
      navigate(-1);
    } finally {
      setAbandonandoMision(false);
    }
  };

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

        {personaje && (() => {
          const miParticipante = getParticipanteByPersonajeId(jugadorActual?.personajeId ?? jugadorActual?.id ?? personajeId);
          const miColor = getColorByOrden(miParticipante?.ordenUnion);
          return (
            <div className="tb-seccion">
              <span className="tb-seccion-label">Tu personaje</span>
              <div className="tsm-personaje-row">
                <img
                  src={resolveAvatarUrl(personaje.avatar)}
                  alt={personaje.nombre ?? 'Personaje'}
                  className="tsm-personaje-avatar"
                  style={{ borderColor: miColor, boxShadow: `0 0 8px ${miColor}` }}
                />
                <div className="tsm-personaje-info">
                  <p className="tsm-info-nombre">{personaje.nombre}</p>
                  <p className="tsm-info-sub">Nivel {personaje.nivel ?? '-'}</p>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="tb-seccion">
          <span className="tb-seccion-label">Aliados ({aliadosAMostrar.length})</span>
          <div className="tsm-aliados-stack">
            {aliadosAMostrar.length > 0 ? (
              aliadosAMostrar.map((participante) => {
                const color = getColorByOrden(participante.ordenUnion);
                const conectado = aliadoConectado(participante);

                return (
                  <div key={participante.personajeId} className="tsm-personaje-row">
                    <img
                      src={resolveAvatarUrl(participante.avatar)}
                      alt={participante.nombrePersonaje}
                      className="tsm-personaje-avatar"
                      style={{ borderColor: color, boxShadow: `0 0 8px ${color}` }}
                    />
                    <div className="tsm-personaje-info">
                      <p className="tsm-info-nombre">
                        {participante.nombrePersonaje}
                        {!conectado && ' ⚪'}
                      </p>
                      <p className="tsm-info-sub">
                        {`${participante.nombreUsuario} - Nivel ${participante.nivel ?? '-'}`}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="tb-btn-abandonar"
          onClick={() => setShowAbandonarMisionModal(true)}
          disabled={abandonandoMision}
        >
          Abandonar misión
        </button>

        <button className="tb-btn-salir" onClick={() => navigate(-1)}>← Salir</button>
      </div>

      <ModalAlert
        isOpen={showAbandonarMisionModal}
        title="ABANDONAR MISIÓN"
        message={`¿Estás seguro de que deseas abandonar esta misión? Tu personaje se desvinculará de ${mision?.nombre ?? `Misión ${mision?.id ?? '-'}`}.`}
        confirmText="Abandonar"
        cancelText="Cancelar"
        onConfirm={abandonarMision}
        onCancel={() => setShowAbandonarMisionModal(false)}
        showImage={true}
      />
    </div>
  );
}