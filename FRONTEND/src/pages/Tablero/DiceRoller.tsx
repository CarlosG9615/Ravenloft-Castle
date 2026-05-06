import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './DiceRoller.css';

interface Props {
  dado: string | null;
  resultado: number | null;
  onAnimacionFin: () => void;
}

const container = document.createElement('div');
container.id = 'dice-box-container';
container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;';
document.body.appendChild(container);

export function DiceRoller({ dado, resultado, onAnimacionFin }: Props) {
  const diceBoxRef = useRef<any>(null);
  const [animando, setAnimando] = useState(false);
  const callbackRef = useRef(onAnimacionFin);
  const initializedRef = useRef(false);

  const rollSound = new Audio('public/sounds/diceroll/dado.wav'); 

  useEffect(() => {
    callbackRef.current = onAnimacionFin;
  }, [onAnimacionFin]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    import('@3d-dice/dice-box').then(({ default: DiceBox }) => {
      const box = new DiceBox({
        assetPath: '/assets/dice-box/',
        container: '#dice-box-container',
        gravity: 2,
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
        scale: 25,
        theme: 'default',
        offscreen: true,
        
      });

      box.init().then(() => {


        diceBoxRef.current = box;
        window.dispatchEvent(new Event('resize'));
        console.log('✅ DiceBox listo');
      }).catch((err: any) => console.error('Error init:', err));

    }).catch((err: any) => console.error('Error cargando DiceBox:', err));
  }, []);

  useEffect(() => {
    if (!dado || resultado === null || !diceBoxRef.current) return;

    container.style.pointerEvents = 'all';
    setAnimando(true);

    const diceMap: Record<string, string> = {
      'd4': '1d4', 'd6': '1d6', 'd8': '1d8',
      'd10': '1d10', 'd12': '1d12', 'd20': '1d20',
    };

    const notation = diceMap[dado];
    if (!notation) { setAnimando(false); return; }

    rollSound.currentTime = 0;
    rollSound.play().catch(() => {});

    diceBoxRef.current.roll(notation).then(() => {
      setTimeout(() => {
        setAnimando(false);
        container.style.pointerEvents = 'none';
        callbackRef.current();
        diceBoxRef.current?.clear();
      }, 1500);
    }).catch(() => {
      setAnimando(false);
      callbackRef.current();
    });
  }, [dado, resultado]);

  return createPortal(
    <>
      {animando && resultado !== null && dado && (
        <div style={{
          position: 'fixed',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 72, fontWeight: 'bold', color: '#e2b96f', textShadow: '0 0 20px rgba(226,185,111,0.8)' }}>
            {resultado}
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
            {dado.toUpperCase()}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}