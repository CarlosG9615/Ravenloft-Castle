interface DiarioCampanaProps {
  nombre: string;
}

export function DiarioCampana({ nombre }: DiarioCampanaProps) {
  return (
    <div className="sf-pergamino sf-diario">
      <img src="/images/ravenloft-ficha-logo.png" alt="" className="sf-corner sf-corner--tl" />
      <img src="/images/ravenloft-ficha-logo.png" alt="" className="sf-corner sf-corner--tr" />

      <div className="sf-cabecera">
        <div className="sf-cabecera-linea" />
        <div className="sf-cabecera-centro">
          <p className="sf-ficha-label">Registro de Aventurero</p>
          <h1 className="sf-nombre" style={{ fontSize: '26px' }}>Diario de Campaña</h1>
          <p className="sf-raza-clase">{nombre || 'Aventurero'}</p>
        </div>
        <div className="sf-cabecera-linea" />
      </div>

      <div className="sf-diario-campos">
        <div className="sf-diario-campo">
          <span className="sf-diario-campo-label">✦ Fecha de Sesión</span>
          <div className="sf-diario-linea-larga" />
        </div>
        <div className="sf-diario-campo">
          <span className="sf-diario-campo-label">✦ Lugar</span>
          <div className="sf-diario-linea-larga" />
        </div>
      </div>

      <div className="sf-diario-sep">
        <div className="sf-sep-linea" />
        <span className="sf-sep-texto">Eventos Clave y Notas</span>
        <div className="sf-sep-linea" />
      </div>

      <div className="sf-diario-notas">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="sf-diario-nota-linea">
            <span className="sf-nota-dot">✦</span>
            <div className="sf-nota-linea" />
          </div>
        ))}
      </div>

      <div className="sf-diario-ornamento">
        <svg viewBox="0 0 120 20" className="sf-orn-svg">
          <line x1="0" y1="10" x2="45" y2="10" stroke="rgba(120,80,30,0.4)" strokeWidth="1"/>
          <path d="M50 10 Q55 4 60 10 Q65 16 70 10" stroke="rgba(120,80,30,0.5)" strokeWidth="1.2" fill="none"/>
          <line x1="75" y1="10" x2="120" y2="10" stroke="rgba(120,80,30,0.4)" strokeWidth="1"/>
          <circle cx="60" cy="10" r="2" fill="rgba(139,0,0,0.5)"/>
        </svg>
      </div>

      <div className="sf-diario-notas">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="sf-diario-nota-linea">
            <span className="sf-nota-dot">✦</span>
            <div className="sf-nota-linea" />
          </div>
        ))}
      </div>
      <img src="/images/diario-pocion.png" alt="" className="sf-corner-deco sf-corner-deco--bl" />
      <img src="/images/diario-mano.png"   alt="" className="sf-corner-deco sf-corner-deco--br" />
    </div>
  );
}
