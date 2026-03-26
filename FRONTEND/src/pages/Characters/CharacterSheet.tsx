import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CharacterSheet.css';
import { BackButton } from '../../components/BackButton/BackButton';

// ── INTERFACES ───────────────────────────────────────────
interface Stats {
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
}

interface CharacterSheetProps {
  // Props opcionales — si no vienen, la ficha muestra inputs vacíos
  nombre?: string;
  raza?: string;
  clase?: string;
  trasfondo?: string;
  historia?: string;
  imagen?: string | null;
  stats?: Stats;
  // Callbacks para el wizard (paso 4)
  onVolver?: () => void;
  onConfirmar?: () => void;
  // Modo: 'wizard' = paso 4 creación | 'view' = ver personaje guardado
  modo?: 'wizard' | 'view';
}

// ── DATOS D&D ─────────────────────────────────────────────
const STAT_LABELS: Record<string, string> = {
  fuerza: 'Fuerza', destreza: 'Destreza', constitucion: 'Constitución',
  inteligencia: 'Inteligencia', sabiduria: 'Sabiduría', carisma: 'Carisma',
};

const TRASFONDOS: Record<string, { descripcion: string; competencias: string[] }> = {
  'Acólito':          { descripcion: 'Has pasado tu vida al servicio de un templo.',              competencias: ['Perspicacia', 'Religión'] },
  'Artesano Gremial': { descripcion: 'Eres miembro de un gremio artesanal.',                     competencias: ['Perspicacia', 'Persuasión'] },
  'Charlatán':        { descripcion: 'Siempre has tenido don de gentes para engañar.',            competencias: ['Engañar', 'Juego de Manos'] },
  'Criminal':         { descripcion: 'Eres un criminal con experiencia en el lado oscuro.',       competencias: ['Engañar', 'Sigilo'] },
  'Entretenido':      { descripcion: 'Te has formado para actuar ante el público.',               competencias: ['Acrobacias', 'Interpretación'] },
  'Ermitaño':         { descripcion: 'Viviste en reclusión, lejos de la sociedad.',               competencias: ['Medicina', 'Religión'] },
  'Forastero':        { descripcion: 'Creciste en tierras salvajes, lejos de la civilización.',   competencias: ['Atletismo', 'Supervivencia'] },
  'Héroe Popular':    { descripcion: 'Vienes de un humilde origen pero estás destinado a algo grande.', competencias: ['Trato con Animales', 'Supervivencia'] },
  'Noble':            { descripcion: 'Entiendes la riqueza, el poder y los privilegios.',         competencias: ['Historia', 'Persuasión'] },
  'Marinero':         { descripcion: 'Has navegado en un barco durante años.',                    competencias: ['Atletismo', 'Percepción'] },
  'Sabio':            { descripcion: 'Pasaste años aprendiendo los secretos del mundo.',          competencias: ['Arcanos', 'Historia'] },
  'Soldado':          { descripcion: 'Eres un veterano de guerra con experiencia en combate.',    competencias: ['Atletismo', 'Intimidar'] },
  'Urchin':           { descripcion: 'Creciste en las calles de una gran ciudad.',                competencias: ['Juego de Manos', 'Sigilo'] },
};

const HABILIDADES = [
  { nombre: 'Acrobacias',         stat: 'destreza' },
  { nombre: 'Arcanos',            stat: 'inteligencia' },
  { nombre: 'Atletismo',          stat: 'fuerza' },
  { nombre: 'Engañar',            stat: 'carisma' },
  { nombre: 'Historia',           stat: 'inteligencia' },
  { nombre: 'Intimidar',          stat: 'carisma' },
  { nombre: 'Juego de Manos',     stat: 'destreza' },
  { nombre: 'Medicina',           stat: 'sabiduria' },
  { nombre: 'Naturaleza',         stat: 'inteligencia' },
  { nombre: 'Percepción',         stat: 'sabiduria' },
  { nombre: 'Perspicacia',        stat: 'sabiduria' },
  { nombre: 'Persuasión',         stat: 'carisma' },
  { nombre: 'Religión',           stat: 'inteligencia' },
  { nombre: 'Sigilo',             stat: 'destreza' },
  { nombre: 'Supervivencia',      stat: 'sabiduria' },
  { nombre: 'Trato con Animales', stat: 'sabiduria' },
];

const calcMod = (val: number) => {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

const DEFAULT_STATS: Stats = {
  fuerza: 10, destreza: 10, constitucion: 10,
  inteligencia: 10, sabiduria: 10, carisma: 10,
};

// ── DIARIO ────────────────────────────────────────────────
function DiarioCampana({ nombre }: { nombre: string }) {
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

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function CharacterSheet({
  nombre = '',
  raza = '',
  clase = '',
  trasfondo = '',
  historia = '',
  imagen = null,
  stats = DEFAULT_STATS,
  onVolver,
  onConfirmar,
  modo = 'view',
}: CharacterSheetProps) {
  const [tab, setTab] = useState<'ficha' | 'diario'>('ficha');

  const trasfondoData = TRASFONDOS[trasfondo];
  const competencias = trasfondoData?.competencias ?? [];

  const combate = [
    { label: 'Puntos de Golpe', valor: '—' },
    { label: 'Iniciativa',      valor: calcMod(stats.destreza) },
    { label: 'Nivel',           valor: '1' },
    { label: 'Velocidad',       valor: '30 pies' },
    { label: 'Clase Armadura',  valor: '10' },
    { label: 'Bonif. Comp.',    valor: '+2' },
  ];

  const handlePrint = () => window.print();

  return (
    <div className="sf-page">

      {/* BARRA ACCIONES */}
      <div className="sf-actions no-print">
        {modo === 'wizard' && onVolver && (
          <button className="sf-btn sf-btn-back" onClick={onVolver}>← Volver</button>
        )}
        {modo === 'view' && <BackButton />}

        <div className="sf-tabs">
          <button className={`sf-tab ${tab === 'ficha' ? 'active' : ''}`} onClick={() => setTab('ficha')}>
            ⚔ Ficha de Personaje
          </button>
          <button className={`sf-tab ${tab === 'diario' ? 'active' : ''}`} onClick={() => setTab('diario')}>
            📖 Diario de Campaña
          </button>
        </div>

        <div className="sf-btn-group">
          <button className="sf-btn sf-btn-print" onClick={handlePrint}>🖨 Imprimir</button>
          {modo === 'wizard' && onConfirmar && (
            <button className="sf-btn sf-btn-confirm" onClick={onConfirmar}>✦ Confirmar Personaje</button>
          )}
        </div>
      </div>

      {/* ── FICHA ── */}
      {tab === 'ficha' && (
        <div className="sf-pergamino">
          <img src="/images/ravenloft-ficha-logo.png" alt="" className="sf-corner sf-corner--tl" />
          <img src="/images/ravenloft-ficha-logo.png" alt="" className="sf-corner sf-corner--tr" />


          {/* MARCO ÉLFICO */}

          

          {/* CABECERA */}
          <div className="sf-cabecera">
            <div className="sf-cabecera-linea" />
            <div className="sf-cabecera-centro">
              <p className="sf-ficha-label">Ficha de Personaje</p>
              <h1 className="sf-nombre">{nombre || 'Nombre del Personaje'}</h1>
              <p className="sf-raza-clase">
                {raza && clase ? `${raza} · ${clase}` : 'Raza · Clase'}
              </p>
            </div>
            <div className="sf-cabecera-linea" />
          </div>

          {/* CUERPO */}
          <div className="sf-cuerpo">

            {/* COLUMNA IZQ */}
            <div className="sf-col-izq">
              <h3 className="sf-titulo-seccion">Características</h3>
              {Object.entries(stats).map(([stat, valor]) => (
                <div key={stat} className="sf-stat-row">
                  <span className="sf-stat-nombre">{STAT_LABELS[stat]}</span>
                  <span className="sf-stat-valor">{valor}</span>
                  <span className="sf-stat-mod">{calcMod(valor)}</span>
                </div>
              ))}

              <h3 className="sf-titulo-seccion sf-mt">Habilidades</h3>
              {HABILIDADES.map(hab => {
                const esPro = competencias.includes(hab.nombre);
                const val = (stats as any)[hab.stat] ?? 10;
                const mod = Math.floor((val - 10) / 2) + (esPro ? 2 : 0);
                return (
                  <div key={hab.nombre} className={`sf-hab-row ${esPro ? 'pro' : ''}`}>
                    <span className="sf-hab-dot">{esPro ? '●' : '○'}</span>
                    <span className="sf-hab-nombre">{hab.nombre}</span>
                    <span className="sf-hab-mod">{mod >= 0 ? `+${mod}` : mod}</span>
                  </div>
                );
              })}
            </div>

            {/* COLUMNA CENTRO */}
            <div className="sf-col-centro">
              <div className="sf-foto-marco">
                {imagen
                  ? <img src={imagen} alt={nombre} className="sf-foto-img" />
                  : <div className="sf-foto-vacia">?</div>
                }
                <svg viewBox="0 0 220 300" className="sf-foto-svg" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="214" height="294" rx="6"
                    fill="none" stroke="rgba(120,80,30,0.55)" strokeWidth="2"/>
                  <rect x="8" y="8" width="204" height="284" rx="4"
                    fill="none" stroke="rgba(120,80,30,0.25)" strokeWidth="1"/>
                  <path d="M3 30 Q3 3 30 3" stroke="rgba(120,80,30,0.9)" strokeWidth="2.5" fill="none"/>
                  <path d="M190 3 Q217 3 217 30" stroke="rgba(120,80,30,0.9)" strokeWidth="2.5" fill="none"/>
                  <path d="M3 270 Q3 297 30 297" stroke="rgba(120,80,30,0.9)" strokeWidth="2.5" fill="none"/>
                  <path d="M190 297 Q217 297 217 270" stroke="rgba(120,80,30,0.9)" strokeWidth="2.5" fill="none"/>
                  <circle cx="110" cy="5" r="4" fill="rgba(139,0,0,0.6)" stroke="rgba(120,80,30,0.6)" strokeWidth="1"/>
                  <circle cx="110" cy="295" r="4" fill="rgba(139,0,0,0.6)" stroke="rgba(120,80,30,0.6)" strokeWidth="1"/>
                  <circle cx="5" cy="150" r="4" fill="rgba(139,0,0,0.6)" stroke="rgba(120,80,30,0.6)" strokeWidth="1"/>
                  <circle cx="215" cy="150" r="4" fill="rgba(139,0,0,0.6)" stroke="rgba(120,80,30,0.6)" strokeWidth="1"/>
                </svg>
              </div>

              <div className="sf-combate-grid">
                {combate.map(item => (
                  <div key={item.label} className="sf-combate-box">
                    <div className="sf-combate-label">{item.label}</div>
                    <div className="sf-combate-valor">{item.valor}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA DER */}
            <div className="sf-col-der">
              <h3 className="sf-titulo-seccion">Identidad</h3>
              {[
                { label: 'Nombre',       valor: nombre || '—' },
                { label: 'Raza',         valor: raza || '—' },
                { label: 'Clase',        valor: clase || '—' },
                { label: 'Trasfondo',    valor: trasfondo || '—' },
                { label: 'Nivel',        valor: '1' },
                { label: 'Alineamiento', valor: '—' },
              ].map(d => (
                <div key={d.label} className="sf-dato-row">
                  <span className="sf-dato-label">{d.label}</span>
                  <span className="sf-dato-valor">{d.valor}</span>
                </div>
              ))}

              {competencias.length > 0 && (
                <>
                  <h3 className="sf-titulo-seccion sf-mt">Competencias</h3>
                  <div className="sf-competencias">
                    {competencias.map(c => (
                      <span key={c} className="sf-comp-tag">{c}</span>
                    ))}
                  </div>
                </>
              )}

              <h3 className="sf-titulo-seccion sf-mt">Ataques y Conjuros</h3>
              <div className="sf-ataques-tabla">
                <div className="sf-ataques-header">
                  <span>Nombre</span><span>Bonif.</span><span>Daño</span>
                </div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="sf-ataques-row">
                    <span>—</span><span>—</span><span>—</span>
                  </div>
                ))}
              </div>

              {historia && (
                <>
                  <h3 className="sf-titulo-seccion sf-mt">Historia</h3>
                  <p className="sf-historia">{historia}</p>
                </>
              )}

              {trasfondoData && (
                <>
                  <h3 className="sf-titulo-seccion sf-mt">Trasfondo</h3>
                  <p className="sf-historia">{trasfondoData.descripcion}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DIARIO ── */}
      {tab === 'diario' && <DiarioCampana nombre={nombre} />}

    </div>
  );
}