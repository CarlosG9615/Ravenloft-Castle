import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DiceBox from '@3d-dice/dice-box';
import './DiceRoller.css';

interface Props {
  dado: string | null;
  resultado: number | null;
  onAnimacionFin: () => void;
}

export function DiceRoller({ dado, resultado, onAnimacionFin }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const [animando, setAnimando] = useState(false);
  const callbackRef = useRef(onAnimacionFin);
  const initializedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onAnimacionFin;
  }, [onAnimacionFin]);

  // Inicializar DiceBox (se ejecuta una sola vez)
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const container = containerRef.current;

    try {
      const diceBox = new DiceBox({
        container: container,
        assetPath: '/assets/',
        scale: 10,
        enableShadows: true,
        theme: 'default',
      });

      diceBoxRef.current = diceBox;
      console.log('✅ DiceBox inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando DiceBox:', error);
    }
  }, []);

  // Lanzar dado
  useEffect(() => {
    if (!dado || !diceBoxRef.current) return;

    console.log(`🎲 Lanzando ${dado}`);
    setAnimando(true);

    // Mapeo de etiquetas a notación de dados
    const diceMap: { [key: string]: string } = {
      'd4': '1d4',
      'd6': '1d6',
      'd8': '1d8',
      'd10': '1d10',
      'd12': '1d12',
      'd20': '1d20',
    };

    const diceNotation = diceMap[dado];
    if (!diceNotation) {
      console.error(`❌ Dado no reconocido: ${dado}`);
      setAnimando(false);
      return;
    }

    try {
      diceBoxRef.current!.roll(diceNotation).then((result: any) => {
        console.log(`✅ Dado lanzado: ${resultado}`);
        
        // Esperar a que termine la animación
        setTimeout(() => {
          setAnimando(false);
          callbackRef.current();
          
          // Limpiar para el siguiente lanzamiento
          diceBoxRef.current!.clear();
        }, 1500);
      });
    } catch (error) {
      console.error('❌ Error lanzando dado:', error);
      setAnimando(false);
      callbackRef.current();
    }
  }, [dado, resultado]);

  // Renderizar siempre (oculto cuando no se usa)
  return createPortal(
    <div className={`dr-overlay ${animando ? 'active' : 'hidden'}`}>
      <div className="dr-content">
        <div ref={containerRef} className="dr-canvas-container" />
        {resultado !== null && dado && (
          <div className="dr-resultado">
            <h2 className="dr-resultado-num">{resultado}</h2>
            <p className="dr-resultado-dado">{dado.toUpperCase()}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}