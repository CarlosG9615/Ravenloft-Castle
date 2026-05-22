import { useRef } from 'react';
import { StoryModeDiceRoller } from './StoryModeDiceRoller';

interface StoryModeDicePanelProps {
  dadoActivo: string | null;
  onLanzarDado: (caras: number, label: string) => void;
  onAtaqueAnimacionFin?: (imagenes: string[]) => void;
  turnoActual?: { turnoActualPersonajeId: string | number | null; fase: 'personajes' | 'master' } | null;
  jugadorActual?: any;
  movimientoYaLanzado?: boolean;
  ataqueYaLanzado?: boolean;
}

const DADOS_MOVIMIENTO = [
  { caras: 6,  label: 'd6'  },
  { caras: 12, label: 'd12' },
];

const DADOS_ATAQUE = [
  { caras: 6,  label: 'd6',  imagen: '/images/dadosModHistoria/dado.png',   cantidadResultados: 1 },
  { caras: 12, label: 'd12', imagen: '/images/dadosModHistoria/2dados.png', cantidadResultados: 2 },
  { caras: 20, label: 'd20', imagen: '/images/dadosModHistoria/3dados.png', cantidadResultados: 3 },
];

export function StoryModeDicePanel({
  dadoActivo,
  onLanzarDado,
  onAtaqueAnimacionFin,
  turnoActual,
  jugadorActual,
  movimientoYaLanzado = false,
  ataqueYaLanzado = false,
}: StoryModeDicePanelProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMyTurn =
    turnoActual?.turnoActualPersonajeId?.toString() === jugadorActual?.personajeId?.toString() ||
    turnoActual?.turnoActualPersonajeId?.toString() === jugadorActual?.id?.toString();
  const dadoAtaque = dadoActivo?.startsWith('ataque-')
    ? DADOS_ATAQUE.find(d => 'ataque-' + d.label === dadoActivo) ?? null
    : null;

  const playDiceSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/public/sounds/diceroll/dado.wav');
      }
      // Reset time to start para poder reproducir múltiples veces sin esperar
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  return (
    <>
      <div className="pp-seccion pp-dados-wrap">
        <h3 className="pp-story-dados-title">Dados de Movimiento</h3>
        <div className="pp-dados-grid">
          {DADOS_MOVIMIENTO.map(({ caras, label }) => (
            <button
              key={label}
              className="pp-dado-pick-btn"
              onClick={() => onLanzarDado(caras, label)}
              disabled={dadoActivo !== null || !isMyTurn || movimientoYaLanzado}
            >
              <img src={`/images/dadoCampana/${label}.png`} alt={label} className="pp-dado-pick-img" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <h3 className="pp-story-dados-title">Dados de Ataque y Defensa</h3>
        <div className="pp-dados-grid">
          {DADOS_ATAQUE.map(({ caras, label, imagen, cantidadResultados }) => (
            <button
              key={'ataque-' + label}
              className={`pp-dado-btn pp-dado-imagen-btn ${dadoActivo === ('ataque-' + label) ? 'animando' : ''}`}
              onClick={() => {
                for (let i = 0; i < cantidadResultados; i++) {
                  setTimeout(() => {
                    playDiceSound();
                  }, i * 350);
                }
                onLanzarDado(caras, 'ataque-' + label);
              }}
              // Attack/defense dice must be available to all users (not restricted to the current turn)
              disabled={dadoActivo !== null || ataqueYaLanzado}
            >
              <img src={imagen} alt={label} className="pp-dado-imagen" />
            </button>
          ))}
        </div>
      </div>

      {dadoAtaque && (
        <StoryModeDiceRoller
          cantidadResultados={dadoAtaque.cantidadResultados}
          label={dadoAtaque.label}
          onFin={onAtaqueAnimacionFin ?? (() => {})}
        />
      )}
    </>
  );
}
