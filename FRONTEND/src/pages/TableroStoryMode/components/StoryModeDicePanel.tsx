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
  const isMyTurn =
    turnoActual?.fase === 'personajes' &&
    (turnoActual?.turnoActualPersonajeId?.toString() === jugadorActual?.personajeId?.toString() ||
     turnoActual?.turnoActualPersonajeId?.toString() === jugadorActual?.id?.toString());
  const dadoAtaque = dadoActivo?.startsWith('ataque-')
    ? DADOS_ATAQUE.find(d => 'ataque-' + d.label === dadoActivo) ?? null
    : null;

  return (
    <>
      <div className="pp-seccion pp-dados-wrap">
        <h3 className="pp-story-dados-title">Dados de Movimiento</h3>
        <div className="pp-dados-grid">
          {DADOS_MOVIMIENTO.map(({ caras, label }) => (
            <button
              key={label}
              className={`pp-dado-btn ${dadoActivo === label ? 'animando' : ''}`}
              onClick={() => onLanzarDado(caras, label)}
              disabled={dadoActivo !== null || !isMyTurn || movimientoYaLanzado}
            >
              <span className="pp-dado-icono">{dadoActivo === label ? '💫' : '⬡'}</span>
              <span className="pp-dado-label">{label}</span>
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
                    new Audio('/public/sounds/diceroll/dado.wav').play().catch(() => {});
                  }, i * 350);
                }
                onLanzarDado(caras, 'ataque-' + label);
              }}
              disabled={dadoActivo !== null || !isMyTurn || ataqueYaLanzado}
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
