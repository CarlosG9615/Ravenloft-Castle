import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CharacterSheet.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { getPersonaje, deletePersonaje } from '../../services/personajeService';
import { getCartaUrl } from '../../utils/imageUtils';
import { BookOpen, Sword } from 'pixelarticons/react';

// ── INTERFACES ───────────────────────────────────────────
interface Stats {
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
}

type StatKey = keyof Stats;

export type EntryTipo = 'ataque' | 'conjuro';

export interface AttackSpellEntry {
  id: string;
  nombre: string;
  bonificador: string;
  dano: string;
  tipo: EntryTipo;
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
  puntosGolpeMax?: number;
  entradasAtaquesConjuros?: AttackSpellEntry[];
  mostrarFormularioAtaques?: boolean;
  // Callbacks para el wizard (paso 4)
  onVolver?: () => void;
  onConfirmar?: () => void;
  // Modo: 'wizard' = paso 4 creación | 'view' = ver personaje guardado
  modo?: 'wizard' | 'view';
}

interface PersonajeResponseDTO {
  id: number;
  nombre: string;
  clase: string;
  raza: string;
  nivel: number;
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
  puntosGolpeMax?: number;
  claseArmadura?: number;
  iniciativa?: number;
  velocidad?: number;
  bonificacionCompetencia?: number;
  avatar?: string | null;
  alineamiento?: string | null;
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

const HABILIDADES: { nombre: string; stat: StatKey }[] = [
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

const createEntryId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatBonus = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

const buildDefaultEntries = (clase: string, stats: Stats, bonifComp: number): AttackSpellEntry[] => {
  const modFuerza = Math.floor((stats.fuerza - 10) / 2);
  const modDestreza = Math.floor((stats.destreza - 10) / 2);
  const modInt = Math.floor((stats.inteligencia - 10) / 2);
  const modSab = Math.floor((stats.sabiduria - 10) / 2);
  const modCar = Math.floor((stats.carisma - 10) / 2);

  const ataque = (nombre: string, bonus: number, dano: string): AttackSpellEntry => ({
    id: createEntryId(),
    nombre,
    bonificador: formatBonus(bonus),
    dano,
    tipo: 'ataque',
  });

  const conjuro = (nombre: string, bonus: number, dano: string): AttackSpellEntry => ({
    id: createEntryId(),
    nombre,
    bonificador: formatBonus(bonus),
    dano,
    tipo: 'conjuro',
  });

  switch (clase) {
    case 'Bárbaro':
      return [ataque('Hacha grande', modFuerza + bonifComp, '1d12 + Fue')];
    case 'Guerrero':
      return [ataque('Espada larga', modFuerza + bonifComp, '1d8 + Fue')];
    case 'Pícaro':
      return [ataque('Daga', modDestreza + bonifComp, '1d4 + Des')];
    case 'Mago':
      return [conjuro('Rayo de fuego', modInt + bonifComp, '1d10 fuego')];
    case 'Clérigo':
      return [conjuro('Llama sagrada', modSab + bonifComp, '1d8 radiante')];
    case 'Bardo':
      return [conjuro('Burla viciosa', modCar + bonifComp, '1d4 psíquico')];
    default:
      return [ataque('Ataque básico', modFuerza + bonifComp, '1d6 + Fue')];
  }
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
  puntosGolpeMax,
  entradasAtaquesConjuros,
  mostrarFormularioAtaques = true,
  onVolver,
  onConfirmar,
  modo = 'view',
}: CharacterSheetProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'ficha' | 'diario'>('ficha');
  const [personaje, setPersonaje] = useState<PersonajeResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attacks, setAttacks] = useState<AttackSpellEntry[]>([]);
  const [spells, setSpells] = useState<AttackSpellEntry[]>([]);
  const [entriesKey, setEntriesKey] = useState<string | null>(null);
  const [entryTipo, setEntryTipo] = useState<EntryTipo>('ataque');
  const [entryNombre, setEntryNombre] = useState('');
  const [entryBonificador, setEntryBonificador] = useState('');
  const [entryDano, setEntryDano] = useState('');
  const allowEdits = mostrarFormularioAtaques;

  useEffect(() => {
    if (modo !== 'view' || !id) return;

    const loadPersonaje = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPersonaje(Number(id));
        setPersonaje(data);
      } catch (err) {
        console.error('Error cargando personaje:', err);
        setError('No se pudo cargar el personaje.');
      } finally {
        setLoading(false);
      }
    };

    loadPersonaje();
  }, [id, modo]);

  const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
  const isDataUrl = (value: string) => /^data:/i.test(value);

  const resolveCartaUrl = (avatarValue?: string | null) => {
    if (!avatarValue) return null;
    if (isAbsoluteUrl(avatarValue) || isDataUrl(avatarValue)) return avatarValue;
    return getCartaUrl(avatarValue);
  };

  const nombreFinal = personaje?.nombre ?? nombre;
  const razaFinal = personaje?.raza ?? raza;
  const claseFinal = personaje?.clase ?? clase;
  const trasfondoFinal = trasfondo;
  const historiaFinal = historia;
  const alineamientoFinal = personaje?.alineamiento ?? '—';
  const imagenFinal = modo === 'view' ? resolveCartaUrl(personaje?.avatar) : imagen;

  const statsFinales = useMemo<Stats>(() => (
    personaje
      ? {
          fuerza: personaje.fuerza,
          destreza: personaje.destreza,
          constitucion: personaje.constitucion,
          inteligencia: personaje.inteligencia,
          sabiduria: personaje.sabiduria,
          carisma: personaje.carisma,
        }
      : stats
  ), [personaje, stats]);

  const trasfondoData = TRASFONDOS[trasfondoFinal];
  const competencias = trasfondoData?.competencias ?? [];

  const bonifComp = personaje?.bonificacionCompetencia ?? 2;

  useEffect(() => {
    if (modo !== 'view') {
      setEntriesKey(null);
      return;
    }
    const keyBase = personaje?.id ?? nombreFinal;
    setEntriesKey(keyBase ? `rc:attacks-spells:${keyBase}` : null);
  }, [modo, personaje?.id, nombreFinal]);

  useEffect(() => {
    if (!entradasAtaquesConjuros || entradasAtaquesConjuros.length === 0) return;
    setAttacks(entradasAtaquesConjuros.filter(entry => entry.tipo === 'ataque'));
    setSpells(entradasAtaquesConjuros.filter(entry => entry.tipo === 'conjuro'));
  }, [entradasAtaquesConjuros]);

  useEffect(() => {
    if (modo !== 'view') return;
    if (!entriesKey) return;
    if (entradasAtaquesConjuros && entradasAtaquesConjuros.length > 0) return;

    const raw = localStorage.getItem(entriesKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AttackSpellEntry[];
        setAttacks(parsed.filter(entry => entry.tipo === 'ataque'));
        setSpells(parsed.filter(entry => entry.tipo === 'conjuro'));
        return;
      } catch {
        // Si hay datos corruptos, los regeneramos por defecto.
      }
    }

    const defaults = buildDefaultEntries(claseFinal, statsFinales, bonifComp);
    setAttacks(defaults.filter(entry => entry.tipo === 'ataque'));
    setSpells(defaults.filter(entry => entry.tipo === 'conjuro'));
  }, [entriesKey, claseFinal, statsFinales, bonifComp, modo, entradasAtaquesConjuros]);

  useEffect(() => {
    if (modo !== 'view') return;
    if (!entriesKey) return;
    const payload = JSON.stringify([...attacks, ...spells]);
    localStorage.setItem(entriesKey, payload);
  }, [entriesKey, attacks, spells, modo]);

  const addEntry = () => {
    const nombreLimpio = entryNombre.trim();
    const bonifLimpio = entryBonificador.trim();
    const danoLimpio = entryDano.trim();
    if (!nombreLimpio || !bonifLimpio || !danoLimpio) return;

    const nuevo: AttackSpellEntry = {
      id: createEntryId(),
      nombre: nombreLimpio,
      bonificador: bonifLimpio,
      dano: danoLimpio,
      tipo: entryTipo,
    };

    if (entryTipo === 'ataque') {
      setAttacks(prev => [...prev, nuevo]);
    } else {
      setSpells(prev => [...prev, nuevo]);
    }

    setEntryNombre('');
    setEntryBonificador('');
    setEntryDano('');
  };

  const removeEntry = (id: string, tipo: EntryTipo) => {
    if (tipo === 'ataque') {
      setAttacks(prev => prev.filter(item => item.id !== id));
      return;
    }
    setSpells(prev => prev.filter(item => item.id !== id));
  };

  const renderAttacksAndSpells = () => {
    const rows = [...attacks, ...spells];
    if (rows.length === 0) {
      return [1, 2, 3, 4].map((i) => (
        <div key={`empty-${i}`} className="sf-ataques-row">
          <span>—</span><span>—</span><span>—</span>
        </div>
      ));
    }

    return rows.map((entry) => (
      <div
        key={entry.id}
        className={`sf-ataques-row ${entry.tipo === 'conjuro' ? 'sf-ataques-row--spell' : ''}`}
      >
        <span>{entry.tipo === 'conjuro' ? `Conjuro: ${entry.nombre}` : entry.nombre}</span>
        <span>{entry.bonificador}</span>
        <span>
          {entry.dano}
          {allowEdits && (
            <button
              type="button"
              className="sf-ataques-delete"
              onClick={() => removeEntry(entry.id, entry.tipo)}
              aria-label={`Eliminar ${entry.nombre}`}
            >
              ✕
            </button>
          )}
        </span>
      </div>
    ));
  };

  const combate = [
    {
      label: 'Puntos de Golpe',
      valor: personaje?.puntosGolpeMax?.toString()
        ?? (typeof puntosGolpeMax === 'number' ? puntosGolpeMax.toString() : '—'),
    },
    { label: 'Iniciativa',      valor: personaje?.iniciativa?.toString() ?? calcMod(statsFinales.destreza) },
    { label: 'Nivel',           valor: personaje?.nivel?.toString() ?? '1' },
    { label: 'Velocidad',       valor: personaje?.velocidad ? `${personaje.velocidad} pies` : '30 pies' },
    { label: 'Clase Armadura',  valor: personaje?.claseArmadura?.toString() ?? '10' },
    { label: 'Bonif. Comp.',    valor: personaje?.bonificacionCompetencia ? `+${personaje.bonificacionCompetencia}` : '+2' },
  ];

  const handlePrint = () => window.print();

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este personaje? Esta acción es irreversible.')) return;
    try {
      await deletePersonaje(Number(id));
      navigate('/characters/list');
    } catch (err) {
      console.error('Error al eliminar personaje:', err);
      alert('Hubo un error al eliminar el personaje.');
    }
  };

  if (modo === 'view' && loading) {
    return (
      <div className="sf-page">
        <div className="sf-actions no-print">
          <BackButton />
        </div>
        <div className="container py-5 text-center text-light">
          Cargando personaje...
        </div>
      </div>
    );
  }

  if (modo === 'view' && error) {
    return (
      <div className="sf-page">
        <div className="sf-actions no-print">
          <BackButton />
        </div>
        <div className="container py-5 text-center text-light">
          {error}
        </div>
      </div>
    );
  }

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
            <Sword /> Ficha de Personaje
          </button>
          <button className={`sf-tab ${tab === 'diario' ? 'active' : ''}`} onClick={() => setTab('diario')}>
            <BookOpen /> Diario de Campaña
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

          <div className="sf-marco-elfico" />

          {/* CABECERA */}
          <div className="sf-cabecera">
            <div className="sf-cabecera-linea" />
            <div className="sf-cabecera-centro">
              <p className="sf-ficha-label">Ficha de Personaje</p>
              <h1 className="sf-nombre">{nombreFinal || 'Nombre del Personaje'}</h1>
              <p className="sf-raza-clase">
                {razaFinal && claseFinal ? `${razaFinal} · ${claseFinal}` : 'Raza · Clase'}
              </p>
            </div>
            <div className="sf-cabecera-linea" />
          </div>

          {/* CUERPO */}
          <div className="sf-cuerpo">

            {/* COLUMNA IZQ */}
            <div className="sf-col-izq">
              <h3 className="sf-titulo-seccion">Características</h3>
              {Object.entries(statsFinales).map(([stat, valor]) => (
                <div key={stat} className="sf-stat-row">
                  <span className="sf-stat-nombre">{STAT_LABELS[stat]}</span>
                  <span className="sf-stat-valor">{valor}</span>
                  <span className="sf-stat-mod">{calcMod(valor)}</span>
                </div>
              ))}

              <h3 className="sf-titulo-seccion sf-mt">Habilidades</h3>
              {HABILIDADES.map(hab => {
                const esPro = competencias.includes(hab.nombre);
                const val = statsFinales[hab.stat] ?? 10;
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
                {imagenFinal
                  ? <img src={imagenFinal} alt={nombreFinal} className="sf-foto-img" />
                  : <div className="sf-foto-vacia">?</div>
                }
              </div>

              <div className="sf-combate-grid">
                {combate.map(item => (
                  <div key={item.label} className="sf-combate-box">
                    <div className="sf-combate-label">{item.label}</div>
                    <div className="sf-combate-valor">{item.valor}</div>
                  </div>
                ))}
              </div>

              {modo === 'view' && (
                <button
                  className="sf-btn sf-btn-delete no-print w-100"
                  onClick={handleDelete}
                  style={{ marginTop: 'auto', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <i className="bi bi-trash"></i> Eliminar Personaje
                </button>
              )}
            </div>

            {/* COLUMNA DER */}
            <div className="sf-col-der">
              <h3 className="sf-titulo-seccion">Identidad</h3>
              {[
                { label: 'Nombre',       valor: nombreFinal || '—' },
                { label: 'Raza',         valor: razaFinal || '—' },
                { label: 'Clase',        valor: claseFinal || '—' },
                { label: 'Trasfondo',    valor: trasfondoFinal || '—' },
                { label: 'Nivel',        valor: personaje?.nivel?.toString() ?? '1' },
                { label: 'Alineamiento', valor: alineamientoFinal },
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
                {renderAttacksAndSpells()}
              </div>

              {/* Alta rapida de ataques/conjuros */}
              {allowEdits && (
                <div className="sf-ataques-form">
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Tipo</label>
                    <select
                      className="sf-ataques-input"
                      value={entryTipo}
                      onChange={(e) => setEntryTipo(e.target.value as EntryTipo)}
                    >
                      <option value="ataque">Ataque</option>
                      <option value="conjuro">Conjuro</option>
                    </select>
                  </div>
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Nombre</label>
                    <input
                      className="sf-ataques-input"
                      type="text"
                      value={entryNombre}
                      onChange={(e) => setEntryNombre(e.target.value)}
                      placeholder="Ej: Espada larga"
                    />
                  </div>
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Bonificador</label>
                    <input
                      className="sf-ataques-input"
                      type="text"
                      value={entryBonificador}
                      onChange={(e) => setEntryBonificador(e.target.value)}
                      placeholder="Ej: +5"
                    />
                  </div>
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Daño</label>
                    <input
                      className="sf-ataques-input"
                      type="text"
                      value={entryDano}
                      onChange={(e) => setEntryDano(e.target.value)}
                      placeholder="Ej: 1d8 + Fue"
                    />
                  </div>
                  <div className="sf-ataques-form-actions">
                    <button type="button" className="sf-btn" onClick={addEntry}>
                      Agregar
                    </button>
                  </div>
                </div>
              )}

              {historiaFinal && (
                <>
                  <h3 className="sf-titulo-seccion sf-mt">Historia</h3>
                  <p className="sf-historia">{historiaFinal}</p>
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
      {tab === 'diario' && <DiarioCampana nombre={nombreFinal} />}

    </div>
  );
}

