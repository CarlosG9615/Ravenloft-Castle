import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './StoryModeDiceRoller.css';

// Distribución real del dado: 3 daño, 2 defensa, 1 victoriaEnemigo
const CARAS_DADO = ['daño', 'daño', 'daño', 'defensa', 'defensa', 'victoriaEnemigo'] as const;
const IMG_BASE = '/images/dadosModHistoria/';

// Tamaño de la cara visual (mayor que HALF*2 para que se solapen en los bordes)
const HALF = 90; // distancia de cada cara al centro

const LADOS = [
  { x: '-140vw', y: '0px'    },
  { x: '140vw',  y: '0px'    },
  { x: '0px',    y: '-130vh' },
  { x: '0px',    y: '130vh'  },
  { x: '-115vw', y: '-100vh' },
  { x: '115vw',  y: '-100vh' },
  { x: '-115vw', y: '100vh'  },
  { x: '115vw',  y: '100vh'  },
];

const FACE_TRANSFORMS = [
  `translateZ(${HALF}px)`,
  `rotateY(180deg) translateZ(${HALF}px)`,
  `rotateY(-90deg) translateZ(${HALF}px)`,
  `rotateY(90deg) translateZ(${HALF}px)`,
  `rotateX(90deg) translateZ(${HALF}px)`,
  `rotateX(-90deg) translateZ(${HALF}px)`,
];

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function DadoCSSCube({ faces }: { faces: string[] }) {
  return (
    <div className="smdr-cubo">
      {FACE_TRANSFORMS.map((faceTransform, i) => (
        <div key={i} className="smdr-cara" style={{ transform: faceTransform }}>
          <img src={`${IMG_BASE}diseñoDado.png`} alt="dado" className="smdr-cara-bg" />
          <img src={`${IMG_BASE}${faces[i]}.png`} alt={faces[i]} className="smdr-cara-symbol" />
        </div>
      ))}
    </div>
  );
}

interface Props {
  cantidadResultados: number;
  label: string;
  onFin: (imagenes: string[]) => void;
}

export function StoryModeDiceRoller({ cantidadResultados, onFin }: Props) {
  const [aterrizados, setAterrizados] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const [dadosDatos] = useState(() => {
    const ladosBarajados = [...LADOS].sort(() => Math.random() - 0.5);

    const baseAngle = Math.random() * 2 * Math.PI;
    const angleStep = cantidadResultados > 1 ? (2 * Math.PI) / cantidadResultados : 0;
    const spreadR = cantidadResultados === 3 ? 310 : cantidadResultados === 2 ? 230 : 0;

    return Array.from({ length: cantidadResultados }, (_, i) => {
      // Barajar las 6 caras ponderadas; la cara frontal (índice 0) es el resultado
      const faces = [...CARAS_DADO].sort(() => Math.random() - 0.5);
      const resultado = faces[0];

      let finalX: number, finalY: number;
      if (cantidadResultados === 1) {
        finalX = rand(-80, 80);
        finalY = rand(-50, 50);
      } else {
        const angle = baseAngle + i * angleStep + rand(-0.2, 0.2);
        const r = spreadR + rand(-20, 20);
        finalX = Math.cos(angle) * r;
        finalY = Math.sin(angle) * r * 0.55;
      }

      return {
        lado: ladosBarajados[i],
        delay: i * 0.35,
        finalX,
        finalY,
        giroX: (Math.random() > 0.5 ? 1 : -1) * 360,
        giroY: (Math.floor(Math.random() * 2) + 3) * 360,
        faces,
        resultado,
      };
    });
  });

  useEffect(() => {
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setAterrizados(true));
    });

    const duracionMs = (cantidadResultados - 1) * 350 + 2800 + 600;

    const timerSalida = setTimeout(() => setSaliendo(true), duracionMs + 400);
    const timerFin = setTimeout(() => {
      onFin(dadosDatos.map(d => d.resultado));
    }, duracionMs + 900);

    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
      clearTimeout(timerSalida);
      clearTimeout(timerFin);
    };
  }, [cantidadResultados, dadosDatos, onFin]);

  return createPortal(
    <div className={`smdr-container${saliendo ? ' smdr-saliendo' : ''}`}>
      <div className="smdr-dados-area">
        {dadosDatos.map((dado, i) => (
          <div
            key={i}
            className="smdr-dado-posicion"
            style={{
              transform: aterrizados
                ? `translate(calc(-50% + ${dado.finalX}px), calc(-50% + ${dado.finalY}px)) scale(1)`
                : `translate(calc(-50% + ${dado.lado.x}), calc(-50% + ${dado.lado.y})) scale(0.5)`,
              transition: aterrizados
                ? `transform 2.8s cubic-bezier(0.16, 1, 0.3, 1) ${dado.delay}s`
                : 'none',
            }}
          >
            <div
              className="smdr-dado-giro"
              style={{
                '--giro-x': `${dado.giroX}deg`,
                '--giro-total': `${dado.giroY}deg`,
                '--giro-z': '0deg',
                animation: `smdrCuboGiro 2.0s ease-out ${dado.delay}s both`,
              } as React.CSSProperties}
            >
              <DadoCSSCube faces={dado.faces} />
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
