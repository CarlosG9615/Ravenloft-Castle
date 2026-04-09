import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './DiceRoller.css';

interface Props {
  dado: string | null;
  resultado: number | null;
  onAnimacionFin: () => void;
}

// Caras según el tipo de dado
const CARAS: Record<string, number[]> = {
  d4:  [1, 2, 3, 4],
  d6:  [1, 2, 3, 4, 5, 6],
  d8:  [1, 2, 3, 4, 5, 6, 7, 8],
  d10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  d12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  d20: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
};

// SVG de cada dado
const DADO_SVG: Record<string, React.ReactElement> = {
  d4: (
    <svg viewBox="0 0 100 100" className="dr-dado-svg">
      <polygon points="50,5 95,85 5,85" fill="#8b0000" stroke="#c0392b" strokeWidth="2"/>
      <text x="50" y="72" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" className="dr-numero"/>
    </svg>
  ),
  d6: (
    <svg viewBox="0 0 100 100" className="dr-dado-svg">
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#8b0000" stroke="#c0392b" strokeWidth="2"/>
      <text x="50" y="65" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" className="dr-numero"/>
    </svg>
  ),
  d8: (
    <svg viewBox="0 0 100 100" className="dr-dado-svg">
      <polygon points="50,2 98,50 50,98 2,50" fill="#8b0000" stroke="#c0392b" strokeWidth="2"/>
      <text x="50" y="62" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" className="dr-numero"/>
    </svg>
  ),
  d10: (
    <svg viewBox="0 0 100 100" className="dr-dado-svg">
      <polygon points="50,2 95,30 95,70 50,98 5,70 5,30" fill="#8b0000" stroke="#c0392b" strokeWidth="2"/>
      <text x="50" y="62" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" className="dr-numero"/>
    </svg>
  ),
  d12: (
    <svg viewBox="0 0 100 100" className="dr-dado-svg">
      <polygon points="50,2 93,25 98,72 63,98 37,98 2,72 7,25" fill="#8b0000" stroke="#c0392b" strokeWidth="2"/>
      <text x="50" y="62" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" className="dr-numero"/>
    </svg>
  ),
  d20: (
    <svg viewBox="0 0 100 100" className="dr-dado-svg">
      <polygon points="50,2 97,27 97,73 50,98 3,73 3,27" fill="#8b0000" stroke="#c0392b" strokeWidth="2"/>
      <text x="50" y="62" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" className="dr-numero"/>
    </svg>
  ),
};

export function DiceRoller({ dado, resultado, onAnimacionFin }: Props) {
  const [numMostrado, setNumMostrado] = useState<number | null>(null);
  const [fase, setFase] = useState<'rodando' | 'resultado' | 'oculto'>('oculto');

  useEffect(() => {
    if (!dado || resultado === null) {
      setFase('oculto');
      return;
    }

    const caras = CARAS[dado] ?? [1];
    setFase('rodando');
    setNumMostrado(null);

    // Animar números al azar rápido
    let ticks = 0;
    const maxTicks = 18;
    const interval = setInterval(() => {
      ticks++;
      const random = caras[Math.floor(Math.random() * caras.length)];
      setNumMostrado(random);

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setNumMostrado(resultado);
        setFase('resultado');

        // Ocultar tras 1.8s
        setTimeout(() => {
          setFase('oculto');
          onAnimacionFin();
        }, 1800);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [dado, resultado]);

  

  const svgDado = dado ? DADO_SVG[dado] : null;

  return createPortal(
    <div className={`dr-overlay ${fase === 'oculto' ? 'dr-hidden' : ''}`}>
      <div className="dr-backdrop" />
      <div className={`dr-dado-wrap ${fase === 'resultado' ? 'show-result' : 'rolling'}`}>
        <div className="dr-dado-container">
          {svgDado}
          <span className="dr-num-overlay">{numMostrado ?? ''}</span>
        </div>
        <p className="dr-label">
          {fase === 'rodando' ? `Lanzando ${dado}...` : `¡${resultado}!`}
        </p>
        {fase === 'resultado' && resultado !== null && (
          <p className={`dr-calificacion ${resultado >= 18 ? 'critico' : resultado <= 2 ? 'pifia' : ''}`}>
            {resultado === 20 ? '⚡ ¡CRÍTICO!' : resultado === 1 ? '💀 PIFIA' : ''}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}