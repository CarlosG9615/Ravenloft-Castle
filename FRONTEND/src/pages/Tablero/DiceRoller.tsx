import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DiceBox from '@3d-dice/dice-box';
import './DiceRoller.css';

interface Props {
  dado: string | null;
  resultado: number | null;
  onAnimacionFin: () => void;
}

export function DiceRoller({ dado, resultado, onAnimacionFin }: Props) {
  const boxRef = useRef<any>(null);
  const iniciado = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Crear el contenedor fijo en el DOM una sola vez
  useEffect(() => {
    // Crear div fijo en body
    const container = document.createElement('div');
    container.id = 'dice-box-container';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9998;
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(container);
    containerRef.current = container;

    // Inicializar DiceBox
    const box = new DiceBox('#dice-box-container', {
      assetPath: '/assets/',
      theme: 'default',
      scale: 8,
      gravity: 1.5,
      mass: 1,
      friction: 0.8,
      restitution: 0.3,
      angularDamping: 0.4,
      linearDamping: 0.5,
      spinForce: 8,
      throwForce: 6,
      startingHeight: 12,
      settleTimeout: 3000,
      enableShadows: true,
      delay: 10,
    });

    box.init().then(() => {
      boxRef.current = box;
      iniciado.current = true;

      box.onRollComplete = (results: any[]) => {
        // Esperar 1.5s para que el usuario vea el resultado
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.display = 'none';
          }
          box.clear();
          onAnimacionFin();
        }, 1500);
      };
    }).catch((err: any) => {
      console.error('DiceBox init error:', err);
    });

    return () => {
      if (containerRef.current) {
        document.body.removeChild(containerRef.current);
      }
    };
  }, []);

  // Tirar cuando cambia el dado
  useEffect(() => {
    if (!dado || !iniciado.current || !boxRef.current) return;

    // Mostrar contenedor
    if (containerRef.current) {
      containerRef.current.style.display = 'block';
    }

    boxRef.current.clear();

    setTimeout(() => {
      if (boxRef.current) {
        boxRef.current.roll(`1${dado}`);
      }
    }, 50);

  }, [dado]);

  // El overlay con el label se renderiza aparte via portal
  if (!dado) return null;

  return createPortal(
    <div className="dr-label-overlay">
      <p className="dr-label-texto">Lanzando {dado}...</p>
    </div>,
    document.body
  );
}