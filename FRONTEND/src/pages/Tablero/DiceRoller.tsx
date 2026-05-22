import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './DiceRoller.css';

interface Props {
  dado: string | null;
  resultado: number | null;

  onAnimacionFin: (resultadoReal: number) => void;
  containerId?: string;

}

const buildNotation = (dado: string | null) => {
  if (!dado) return null;
  const cleaned = dado.trim().toLowerCase();
  if (/^\d+d\d+$/.test(cleaned)) return cleaned;
  if (/^d\d+$/.test(cleaned)) return `1${cleaned}`;
  const diceMap: Record<string, string> = {
    'd4': '1d4', 'd6': '1d6', 'd8': '1d8',
    'd10': '1d10', 'd12': '1d12', 'd20': '1d20',
  };
  return diceMap[cleaned] ?? null;
};

const sumDiceResults = (resultados: any, fallback: number | null) => {
  if (Array.isArray(resultados)) {
    let total = 0;
    let found = false;
    resultados.forEach((item) => {
      if (typeof item?.value === 'number') {
        total += item.value;
        found = true;
        return;
      }
      if (Array.isArray(item?.rolls)) {
        item.rolls.forEach((roll: any) => {
          if (typeof roll?.value === 'number') {
            total += roll.value;
            found = true;
          }
        });
      }
    });
    if (found) return total;
  }
  if (typeof resultados?.total === 'number') return resultados.total;
  if (typeof resultados === 'number') return resultados;
  return fallback ?? 1;
};

export function DiceRoller({ dado, resultado, onAnimacionFin, containerId = 'dice-box-container' }: Props) {
  const diceBoxRef = useRef<any>(null);
  const [, setAnimando] = useState(false);
  const callbackRef = useRef(onAnimacionFin);
  const initializedRef = useRef(false);
  const rollSound = new Audio('public/sounds/diceroll/dado.wav');

  useEffect(() => {
    callbackRef.current = onAnimacionFin;
  }, [onAnimacionFin]);

  useEffect(() => {
    if (initializedRef.current) return;

    const contenedor = document.getElementById(containerId);
    if (!contenedor) return;

    initializedRef.current = true;

    import('@3d-dice/dice-box').then(({ default: DiceBox }) => {
      const box = new DiceBox({
        assetPath: '/assets/dice-box/',
        container: `#${containerId}`,
        gravity: 5,
        mass: 1,
        friction: 0.8,
        restitution: 0,
        angularDamping: 0.4,
        linearDamping: 0.5,
        spinForce: 3,
        themeColor: '#591414',
        throwForce: 1.5,
        startingHeight: 12,
        settleTimeout: 3000,
        scale: 7,
        theme: 'default',
        offscreen: true,
      });

      box.init().then(() => {
        diceBoxRef.current = box;
        setTimeout(() => {
          const canvas = document.querySelector(`#${containerId} canvas`) as HTMLCanvasElement;
          if (canvas) {
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
          }
          window.dispatchEvent(new Event('resize'));
        }, 200);
        console.log('✅ DiceBox listo');
      }).catch((err: any) => console.error('Error init:', err));

    }).catch((err: any) => console.error('Error cargando DiceBox:', err));
  }, [containerId]);

  useEffect(() => {
    if (!dado || resultado === null || !diceBoxRef.current) return;

    setAnimando(true);


    const diceMap: Record<string, number> = {
      'd4': 4, 'd6': 6, 'd8': 8,
      'd10': 10, 'd12': 12, 'd20': 20,
    };

    // Extraer el tipo base del dado (por si viene como "d20 (FUE)" etc.)
    const dadoBase = dado.startsWith('d') ? dado.split(' ')[0] : dado;
    const caras = diceMap[dadoBase];
    if (!caras) { setAnimando(false); return; }

    const notation = buildNotation(dado);
    if (!notation) { setAnimando(false); return; }


    rollSound.currentTime = 0;
    rollSound.play().catch(() => {});

    // Si resultado > 0 forzamos ese valor en la animación 3D
    // Si es 0 dejamos que el dado ruede libremente (no debería pasar con los cambios del PanelPartida)
    const rollConfig = resultado > 0
      ? [{ qty: 1, sides: caras, theme: 'default', themeColor: '#591414', value: resultado }]
      : `1${dadoBase}`;

    diceBoxRef.current.roll(rollConfig).then((resultados: any[]) => {
      console.log('Resultado DiceBox:', JSON.stringify(resultados));

      const resultadoReal = sumDiceResults(resultados, resultado);

      setTimeout(() => {
        setAnimando(false);
        callbackRef.current(resultadoReal);
        diceBoxRef.current?.clear();
      }, 1500);
    }).catch(() => {
      setAnimando(false);
      callbackRef.current(resultado ?? 1);
    });
  }, [dado, resultado]);

  return createPortal(
    <>
      <div id={containerId} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
      }} />
    </>,
    document.body
  );
}