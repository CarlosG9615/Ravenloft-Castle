import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CharacterCreate.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { CharacterSheet, type AttackSpellEntry, type EntryTipo } from './CharacterSheet';
import { getAvatarUrl, getCartaUrl } from '../../utils/imageUtils';
import { createPersonaje, type PersonajeCreatePayload } from '../../services/personajeService';
import { FileText, Clipboard, ColorsSwatch } from 'pixelarticons/react';
import { Dices } from 'lucide-react';
import { DiceRoller } from '../Tablero/DiceRoller';


// ── DATOS D&D 5e ──────────────────────────────────────────
const RAZAS = [
  { nombre: 'Humano',    bonuses: { fuerza:1, destreza:1, constitucion:1, inteligencia:1, sabiduria:1, carisma:1 } },
  { nombre: 'Elfo',      bonuses: { destreza:2 } },
  { nombre: 'Enano',     bonuses: { constitucion:2 } },
  { nombre: 'Halfling',  bonuses: { destreza:2 } },
  { nombre: 'Gnomo',     bonuses: { inteligencia:2 } },
  { nombre: 'Tiefling',  bonuses: { inteligencia:1, carisma:2 } },
  { nombre: 'Semiorco',  bonuses: { fuerza:2, constitucion:1 } },
  { nombre: 'Semielfo',  bonuses: { carisma:2, destreza:1, sabiduria:1 } },
  { nombre: 'Dracónido', bonuses: { fuerza:2, carisma:1 } },
];

const CLASES = [
  'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Explorador',
  'Guerrero', 'Hechicero', 'Mago', 'Monje', 'Paladín', 'Pícaro', 'Brujo'
];

const GENEROS = ['Male', 'Female'] as const;

const TRASFONDOS = [
  { nombre: 'Acólito',          descripcion: 'Has pasado tu vida al servicio de un templo.',              competencias: ['Perspicacia', 'Religión'] },
  { nombre: 'Artesano Gremial', descripcion: 'Eres miembro de un gremio artesanal.',                     competencias: ['Perspicacia', 'Persuasión'] },
  { nombre: 'Charlatán',        descripcion: 'Siempre has tenido don de gentes para engañar.',            competencias: ['Engañar', 'Juego de Manos'] },
  { nombre: 'Criminal',         descripcion: 'Eres un criminal con experiencia en el lado oscuro.',       competencias: ['Engañar', 'Sigilo'] },
  { nombre: 'Entretenido',      descripcion: 'Te has formado para actuar ante el público.',               competencias: ['Acrobacias', 'Interpretación'] },
  { nombre: 'Ermitaño',         descripcion: 'Viviste en reclusión, lejos de la sociedad.',               competencias: ['Medicina', 'Religión'] },
  { nombre: 'Forastero',        descripcion: 'Creciste en tierras salvajes, lejos de la civilización.',   competencias: ['Atletismo', 'Supervivencia'] },
  { nombre: 'Héroe Popular',    descripcion: 'Vienes de un humilde origen pero estás destinado a algo grande.', competencias: ['Trato con Animales', 'Supervivencia'] },
  { nombre: 'Noble',            descripcion: 'Entiendes la riqueza, el poder y los privilegios.',         competencias: ['Historia', 'Persuasión'] },
  { nombre: 'Marinero',         descripcion: 'Has navegado en un barco durante años.',                    competencias: ['Atletismo', 'Percepción'] },
  { nombre: 'Sabio',            descripcion: 'Pasaste años aprendiendo los secretos del mundo.',          competencias: ['Arcanos', 'Historia'] },
  { nombre: 'Soldado',          descripcion: 'Eres un veterano de guerra con experiencia en combate.',    competencias: ['Atletismo', 'Intimidar'] },
  { nombre: 'Urchin',           descripcion: 'Creciste en las calles de una gran ciudad.',                competencias: ['Juego de Manos', 'Sigilo'] },
];

const STATS = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'] as const;
type StatKey = typeof STATS[number];

const STAT_LABELS: Record<StatKey, string> = {
  fuerza: 'Fuerza', destreza: 'Destreza', constitucion: 'Constitución',
  inteligencia: 'Inteligencia', sabiduria: 'Sabiduría', carisma: 'Carisma',
};

const PUNTOS_ESTANDAR = [15, 14, 13, 12, 10, 8];
const MAX_PALABRAS = 120;

const DADO_GOLPE_POR_CLASE: Record<string, number> = {
  'Bárbaro': 12,
  'Guerrero': 10,
  'Paladín': 10,
  'Explorador': 10,
  'Bardo': 8,
  'Clérigo': 8,
  'Druida': 8,
  'Monje': 8,
  'Pícaro': 8,
  'Brujo': 8,
  'Hechicero': 6,
  'Mago': 6,
};

const calcularPuntosGolpeMax = (nombreClase: string, constitucion: number, nivel: number) => {
  const dadoGolpe = DADO_GOLPE_POR_CLASE[nombreClase] ?? 8;
  const nivelUno = dadoGolpe + constitucion;
  if (nivel <= 1) return nivelUno;
  const incrementoPorNivel = Math.floor(dadoGolpe / 2) + 1 + constitucion;
  return nivelUno + (nivel - 1) * incrementoPorNivel;
};

const calcularModificador = (val: number) => {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

// d20 con mínimo 8 — protección exclusiva para creación de personaje
const tirarD20CreacionPersonaje = () => Math.max(8, Math.floor(Math.random() * 20) + 1);

const DRAFT_KEY = 'rc:character-create-draft';
const readDraft = (): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const normalizarClase = (nombre: string) =>
  nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const createEntryId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const contarPalabras = (texto: string) =>
  texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;

// ── COMPONENTE ────────────────────────────────────────────
export function CharacterCreate() {
  const navigate = useNavigate();
  const d = useRef(readDraft()).current;

  const [paso, setPaso] = useState<number>(d?.paso ?? 1);

  // Paso 1
  const [nombre, setNombre] = useState<string>(d?.nombre ?? '');
  const [raza, setRaza] = useState<string>(d?.raza ?? '');
  const [clase, setClase] = useState<string>(d?.clase ?? '');
  const [trasfondo, setTrasfondo] = useState<string>(d?.trasfondo ?? '');
  const [historia, setHistoria] = useState<string>(d?.historia ?? '');

  // Paso 2
  const [metodo, setMetodo] = useState<'puntos' | 'dados'>(d?.metodo ?? 'puntos');
  const [statsEstandar, setStatsEstandar] = useState<Record<StatKey, number | null>>(
    d?.statsEstandar ?? { fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null }
  );
  const [tiradas, setTiradas] = useState<{ id: number; valor: number }[]>(d?.tiradas ?? []);
  const [tiradaAsignada, setTiradaAsignada] = useState<Record<StatKey, number | null>>(
    d?.tiradaAsignada ?? { fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null }
  );
  const [d20Dado, setD20Dado] = useState<string | null>(null);
  const [d20Resultado, setD20Resultado] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [attackSpellEntries, setAttackSpellEntries] = useState<AttackSpellEntry[]>(d?.attackSpellEntries ?? []);
  const [entryTipo, setEntryTipo] = useState<EntryTipo>('ataque');
  const [entryNombre, setEntryNombre] = useState('');
  const [entryBonificador, setEntryBonificador] = useState('');
  const [entryDano, setEntryDano] = useState('');
  const [entryRango, setEntryRango] = useState<number>(1);

  // Paso 3
  const [avatarSeleccionado, setAvatarSeleccionado] = useState<string | null>(d?.avatarSeleccionado ?? null);
  const avatarCustom = null;
  const [guardando, setGuardando] = useState(false);

  const razaData = RAZAS.find(r => r.nombre === raza);
  const trasfondoData = TRASFONDOS.find(t => t.nombre === trasfondo);

  const statsBase: Record<StatKey, number> = STATS.reduce((acc, stat) => {
    if (metodo === 'puntos') {
      acc[stat] = statsEstandar[stat] ?? 8;
    } else {
      const id = tiradaAsignada[stat];
      acc[stat] = id !== null ? (tiradas.find(t => t.id === id)?.valor ?? 8) : 8;
    }
    return acc;
  }, {} as Record<StatKey, number>);

  const statsFinal = STATS.reduce((acc, stat) => {
    const bonus = (razaData?.bonuses as any)?.[stat] || 0;
    acc[stat] = statsBase[stat] + bonus;
    return acc;
  }, {} as Record<StatKey, number>);

  const nivelInicial = 1;
  const puntosGolpeMax = clase
    ? calcularPuntosGolpeMax(clase, statsFinal.constitucion, nivelInicial)
    : null;

  const palabras = contarPalabras(historia);
  const claseApariencia = clase ? normalizarClase(clase) : normalizarClase(CLASES[0]);
  const avatarsDisponibles = GENEROS.map(genero => `${claseApariencia}${genero}`);
  const imagenFinal = avatarSeleccionado ? getCartaUrl(avatarSeleccionado) : (avatarCustom ?? null);

  const handleHistoria = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (contarPalabras(e.target.value) <= MAX_PALABRAS) setHistoria(e.target.value);
  };

  const asignarPuntoEstandar = (stat: StatKey, valor: number | null) =>
    setStatsEstandar(prev => ({ ...prev, [stat]: valor }));

  const valoresUsados = (statActual: StatKey) =>
    STATS.filter(s => s !== statActual).map(s => statsEstandar[s]).filter(v => v !== null) as number[];

  const rollRegistradoRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registrarTirada = (valor: number) => {
    if (rollRegistradoRef.current) return;
    rollRegistradoRef.current = true;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setTiradas(prev => [...prev, { id: prev.length, valor }]);
    setD20Dado(null);
    setD20Resultado(null);
    setIsRolling(false);
  };

  const rollNextD20 = () => {
    if (isRolling || tiradas.length >= 6) return;
    rollRegistradoRef.current = false;
    const result = tirarD20CreacionPersonaje();
    setIsRolling(true);
    setD20Resultado(result);
    setD20Dado('d20');
    const sound = new Audio('/public/sounds/diceroll/dado.wav');
    sound.play().catch(() => {});
    // Fallback solo si DiceBox no responde: settleTimeout(3000) + delay(1500) + margen = 6s
    fallbackTimerRef.current = setTimeout(() => registrarTirada(result), 6000);
  };

  const handleD20AnimacionFin = (resultadoReal: number) => {
    registrarTirada(resultadoReal);
  };

  const reiniciarTiradas = () => {
    setTiradas([]);
    setTiradaAsignada({ fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null });
    setD20Dado(null);
    setD20Resultado(null);
    setIsRolling(false);
  };

  const idsUsados = Object.values(tiradaAsignada).filter(v => v !== null) as number[];

  const asignarTirada = (stat: StatKey, idTirada: number | null) =>
    setTiradaAsignada(prev => ({ ...prev, [stat]: idTirada }));

  // ── DRAG & DROP ───────────────────────────────────────────
  type DragPayload =
    | { source: 'pool-puntos'; valor: number }
    | { source: 'pool-dados';  id: number }
    | { source: 'stat-puntos'; stat: StatKey }
    | { source: 'stat-dados';  stat: StatKey };

  const dragPayload = useRef<DragPayload | null>(null);
  const [dragOverStat, setDragOverStat] = useState<StatKey | null>(null);

  const handleDropOnStat = (targetStat: StatKey) => {
    const p = dragPayload.current;
    setDragOverStat(null);
    dragPayload.current = null;
    if (!p) return;

    if (p.source === 'pool-puntos') {
      // Si el valor ya está asignado a otro stat, swap
      const prevHolder = STATS.find(s => statsEstandar[s] === p.valor);
      if (prevHolder && prevHolder !== targetStat) {
        const displaced = statsEstandar[targetStat];
        setStatsEstandar(prev => ({ ...prev, [prevHolder]: displaced, [targetStat]: p.valor }));
      } else {
        asignarPuntoEstandar(targetStat, p.valor);
      }
    } else if (p.source === 'pool-dados') {
      // Si el id ya está asignado a otro stat, swap
      const prevHolder = STATS.find(s => tiradaAsignada[s] === p.id);
      if (prevHolder && prevHolder !== targetStat) {
        const displaced = tiradaAsignada[targetStat];
        setTiradaAsignada(prev => ({ ...prev, [prevHolder]: displaced, [targetStat]: p.id }));
      } else {
        asignarTirada(targetStat, p.id);
      }
    } else if (p.source === 'stat-puntos' && p.stat !== targetStat) {
      const sourceVal = statsEstandar[p.stat];
      const targetVal = statsEstandar[targetStat];
      setStatsEstandar(prev => ({ ...prev, [p.stat]: targetVal, [targetStat]: sourceVal }));
    } else if (p.source === 'stat-dados' && p.stat !== targetStat) {
      const sourceId = tiradaAsignada[p.stat];
      const targetId = tiradaAsignada[targetStat];
      setTiradaAsignada(prev => ({ ...prev, [p.stat]: targetId, [targetStat]: sourceId }));
    }
  };

  useEffect(() => {
    setEntryRango(entryTipo === 'conjuro' ? 6 : 1);
  }, [entryTipo]);

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
      rangoCasillas: Number.isFinite(entryRango) ? entryRango : (entryTipo === 'conjuro' ? 6 : 1),
    };

    setAttackSpellEntries(prev => [...prev, nuevo]);
    setEntryNombre('');
    setEntryBonificador('');
    setEntryDano('');
    setEntryRango(entryTipo === 'conjuro' ? 6 : 1);
  };

  const removeEntry = (id: string) =>
    setAttackSpellEntries(prev => prev.filter(item => item.id !== id));

  const cambiarMetodo = (nuevoMetodo: 'puntos' | 'dados') => {
    setMetodo(nuevoMetodo);
    setStatsEstandar({ fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null });
    setTiradaAsignada({ fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null });
  };


  const seleccionarAvatar = (avatarId: string) => {
    setAvatarSeleccionado(avatarId);
  };

  const paso1Valido = nombre.trim() && raza && clase && trasfondo;
  const paso2Valido = metodo === 'puntos'
    ? STATS.every(s => statsEstandar[s] !== null)
    : STATS.every(s => tiradaAsignada[s] !== null);
  const paso3Valido = avatarSeleccionado !== null;

  const normalizarTexto = (valor: string) =>
    valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const buildHabilidades = () => {
    const comps = trasfondoData?.competencias.map(normalizarTexto) ?? [];
    const tiene = (nombre: string) => comps.includes(normalizarTexto(nombre));
    return {
      atletismo: tiene('Atletismo') ? 2 : 0,
      sigilo: tiene('Sigilo') ? 2 : 0,
      persuasion: tiene('Persuasión') ? 2 : 0,
      percepcion: tiene('Percepción') ? 2 : 0,
      arcanos: tiene('Arcanos') ? 2 : 0,
      medicina: tiene('Medicina') ? 2 : 0,
      supervivencia: tiene('Supervivencia') ? 2 : 0,
      intimidacion: tiene('Intimidar') ? 2 : 0,
    };
  };

  const normalizarStatsBaseBackend = (base: Record<StatKey, number>) => {
    const TARGET_TOTAL = 75;
    const MIN = 8;
    const MAX = 15;

    const result: Record<StatKey, number> = {
      fuerza: Math.min(MAX, Math.max(MIN, base.fuerza)),
      destreza: Math.min(MAX, Math.max(MIN, base.destreza)),
      constitucion: Math.min(MAX, Math.max(MIN, base.constitucion)),
      inteligencia: Math.min(MAX, Math.max(MIN, base.inteligencia)),
      sabiduria: Math.min(MAX, Math.max(MIN, base.sabiduria)),
      carisma: Math.min(MAX, Math.max(MIN, base.carisma)),
    };

    let total = STATS.reduce((acc, stat) => acc + result[stat], 0);
    if (total < TARGET_TOTAL) {
      const asc = [...STATS].sort((a, b) => result[a] - result[b]);
      while (total < TARGET_TOTAL) {
        let changed = false;
        for (const stat of asc) {
          if (result[stat] < MAX && total < TARGET_TOTAL) {
            result[stat] += 1;
            total += 1;
            changed = true;
          }
        }
        if (!changed) break;
      }
    }

    if (total > TARGET_TOTAL) {
      const desc = [...STATS].sort((a, b) => result[b] - result[a]);
      while (total > TARGET_TOTAL) {
        let changed = false;
        for (const stat of desc) {
          if (result[stat] > MIN && total > TARGET_TOTAL) {
            result[stat] -= 1;
            total -= 1;
            changed = true;
          }
        }
        if (!changed) break;
      }
    }

    return result;
  };

  const handleConfirmar = async () => {
    if (guardando) return;

    const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const usuarioId = Number(user?.id);

    if (!usuarioId) {
      alert('No se pudo identificar el usuario. Vuelve a iniciar sesion.');
      return;
    }

    const statsBaseBackend = normalizarStatsBaseBackend(statsBase);

    const payload: PersonajeCreatePayload = {
      nombre: nombre.trim(),
      clase,
      raza,
      nivel: nivelInicial,
      statsBase: {
        fuerza: statsBaseBackend.fuerza,
        destreza: statsBaseBackend.destreza,
        constitucion: statsBaseBackend.constitucion,
        inteligencia: statsBaseBackend.inteligencia,
        sabiduria: statsBaseBackend.sabiduria,
        carisma: statsBaseBackend.carisma,
      },
      statsFinales: {
        fuerza: statsFinal.fuerza,
        destreza: statsFinal.destreza,
        constitucion: statsFinal.constitucion,
        inteligencia: statsFinal.inteligencia,
        sabiduria: statsFinal.sabiduria,
        carisma: statsFinal.carisma,
      },
      habilidades: buildHabilidades(),
      puntosGolpeActual: puntosGolpeMax ?? undefined,
      claseArmadura: 10 + Math.floor((statsFinal.destreza - 10) / 2),
      iniciativa: Math.floor((statsFinal.destreza - 10) / 2),
      velocidad: 30,
      avatar: avatarSeleccionado,
      alineamiento: 'Neutral',
      usuarioId,
    };

    try {
      setGuardando(true);
      const created = await createPersonaje(payload);
      if (attackSpellEntries.length > 0) {
        const keyBase = created?.id ?? nombre.trim();
        if (keyBase) {
          localStorage.setItem(`rc:attacks-spells:${keyBase}`, JSON.stringify(attackSpellEntries));
        }
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate('/characters');
    } catch (error) {
      console.error('Error creando personaje:', error);
      alert('No se pudo guardar el personaje. Revisa los datos e intentalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (paso > 1) {
        setPaso(p => p - 1);
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [paso]);

  useEffect(() => {
    if (!avatarCustom) {
      const avatarPorDefecto = `${claseApariencia}Male`;
      setAvatarSeleccionado(prev => {
        if (prev && prev.startsWith(claseApariencia)) return prev;
        return avatarPorDefecto;
      });
    }
  }, [claseApariencia]);

  // Auto-guardado del borrador — se limpia solo al confirmar el personaje
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      paso, nombre, raza, clase, trasfondo, historia,
      metodo, statsEstandar, tiradas, tiradaAsignada,
      attackSpellEntries, avatarSeleccionado,
    }));
  }, [paso, nombre, raza, clase, trasfondo, historia, metodo, statsEstandar, tiradas, tiradaAsignada, attackSpellEntries, avatarSeleccionado]);

  const PASOS = ['Identidad', 'Características', 'Apariencia', 'Ficha Final'];

  return (
    <>
    <div className="create-page">
      <BackButton />
      <div className="container py-5">

        <h1 className="create-title text-center mb-2">⚔ Crear Personaje</h1>

        <div className="create-steps d-flex justify-content-center gap-3 mb-5">
          {PASOS.map((label, i) => (
            <div key={i} className={`create-step ${paso === i + 1 ? 'active' : ''} ${paso > i + 1 ? 'done' : ''}`}>
              <span className="create-step-num">{i + 1}</span>
              <span className="create-step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ══ PASO 1: IDENTIDAD ══ */}
        {paso === 1 && (
          <div className="create-card">
            <h4 className="create-section-title mb-4">
              <FileText width={24} height={24} style={{ color: '#e2b96f' }} /> Identidad del Personaje
            </h4>
            <div className="row g-4">

              <div className="col-12">
                <label className="create-label">Nombre del personaje</label>
                <input type="text" className="form-control create-input"
                  placeholder="¿Cómo se llama tu aventurero?" value={nombre}
                  onChange={e => setNombre(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label className="create-label">Especie / Raza</label>
                <select className="form-select create-input" value={raza} onChange={e => setRaza(e.target.value)}>
                  <option value="">Selecciona una especie...</option>
                  {RAZAS.map(r => <option key={r.nombre} value={r.nombre}>{r.nombre}</option>)}
                </select>
                {raza && razaData && (
                  <div className="create-bonus-preview mt-2">
                    {Object.entries(razaData.bonuses).map(([stat, val]) => (
                      <span key={stat} className="create-bonus-tag">+{val} {STAT_LABELS[stat as StatKey]}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="create-label">Clase</label>
                <select className="form-select create-input" value={clase} onChange={e => setClase(e.target.value)}>
                  <option value="">Selecciona una clase...</option>
                  {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-12">
                <label className="create-label">Trasfondo</label>
                <select className="form-select create-input" value={trasfondo} onChange={e => setTrasfondo(e.target.value)}>
                  <option value="">Selecciona un trasfondo...</option>
                  {TRASFONDOS.map(t => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)}
                </select>
                {trasfondo && trasfondoData && (
                  <div className="create-trasfondo-info mt-3">
                    <p className="create-trasfondo-desc">{trasfondoData.descripcion}</p>
                    <div className="d-flex gap-2 flex-wrap mt-2">
                      <span className="create-trasfondo-label">Competencias:</span>
                      {trasfondoData.competencias.map(c => <span key={c} className="create-bonus-tag">{c}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-12">
                <label className="create-label">
                  Historia del personaje
                  <span className="create-label-optional"> — opcional</span>
                </label>
                <textarea
                  className="form-control create-input create-textarea"
                  placeholder="Cuenta brevemente quién es tu personaje, de dónde viene y qué le mueve a aventurarse... (máx. 120 palabras)"
                  value={historia}
                  onChange={handleHistoria}
                  rows={4}
                />
                <div className={`create-word-count ${palabras > MAX_PALABRAS * 0.9 ? 'warning' : ''}`}>
                  {palabras} / {MAX_PALABRAS} palabras
                </div>
              </div>

            </div>
            <div className="d-flex justify-content-end mt-4">
              <button className="btn create-btn-primary" disabled={!paso1Valido} onClick={() => setPaso(2)}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ══ PASO 2: CARACTERÍSTICAS ══ */}
        {paso === 2 && (
          <div className="create-card">
            <h4 className="create-section-title mb-4">⚔ Características</h4>
            <div className="mb-4">
              <label className="create-label mb-2">Método de asignación</label>
              <div className="d-flex gap-3">
                <button className={`btn create-method-btn ${metodo === 'puntos' ? 'active' : ''}`} onClick={() => cambiarMetodo('puntos')}>
                  <Clipboard width={20} height={20} style={{ color: 'currentColor' }} /> Asignación Estándar
                </button>
                <button className={`btn create-method-btn ${metodo === 'dados' ? 'active' : ''}`} onClick={() => cambiarMetodo('dados')}>
                  <Dices width={20} height={20} style={{ color: 'currentColor' }} /> Tirada de Dados
                </button>
              </div>
              <p className="create-method-desc mt-2">
                {metodo === 'puntos'
                  ? 'Asigna los valores 15, 14, 13, 12, 10 y 8 a tus características. Cada valor solo puede usarse una vez.'
                  : 'Tira 4d6 descartando el menor, repite 6 veces y asigna los resultados a tus características.'}
              </p>
            </div>

            {metodo === 'puntos' && (
              <>
                <div className="mb-3 d-flex gap-2 flex-wrap">
                  {PUNTOS_ESTANDAR.map(p => {
                    const used = Object.values(statsEstandar).includes(p);
                    return (
                      <span
                        key={p}
                        className={`create-tirada-tag ${used ? 'used' : ''}`}
                        draggable
                        onDragStart={() => { dragPayload.current = { source: 'pool-puntos', valor: p }; }}
                        onDragEnd={() => setDragOverStat(null)}
                      >
                        {p}
                      </span>
                    );
                  })}
                  <small className="text-muted ms-2 align-self-center">
                    {STATS.filter(s => statsEstandar[s] !== null).length}/6 asignados
                  </small>
                </div>
                <div className="row g-3">
                  {STATS.map(stat => (
                    <div className="col-md-4" key={stat}>
                      <div
                        className={`create-stat-box ${dragOverStat === stat ? 'drag-over' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOverStat(stat); }}
                        onDragLeave={() => setDragOverStat(null)}
                        onDrop={() => handleDropOnStat(stat)}
                        draggable={statsEstandar[stat] !== null}
                        onDragStart={() => { if (statsEstandar[stat] !== null) dragPayload.current = { source: 'stat-puntos', stat }; }}
                        onDragEnd={() => setDragOverStat(null)}
                      >
                        <span className="create-stat-label">{STAT_LABELS[stat]}</span>
                        <select className="form-select create-input text-center"
                          value={statsEstandar[stat] ?? ''}
                          onChange={e => asignarPuntoEstandar(stat, e.target.value === '' ? null : Number(e.target.value))}>
                          <option value="">— Elige —</option>
                          {PUNTOS_ESTANDAR.map(p => (
                            <option key={p} value={p} disabled={valoresUsados(stat).includes(p)}>
                              {p}{valoresUsados(stat).includes(p) ? ' (en uso)' : ''}
                            </option>
                          ))}
                        </select>
                        {razaData && (razaData.bonuses as any)[stat] && (
                          <span className="create-race-bonus">+{(razaData.bonuses as any)[stat]} raza</span>
                        )}
                        <span className="create-stat-final">
                          {statsEstandar[stat] !== null
                            ? <>{statsFinal[stat]} <small>{calcularModificador(statsFinal[stat])}</small></>
                            : <small className="text-muted">—</small>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {metodo === 'dados' && (
              <>
                <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                  <button
                    className="btn create-btn-primary"
                    onClick={tiradas.length >= 6 ? reiniciarTiradas : rollNextD20}
                    disabled={isRolling}
                  >
                    <Dices width={20} height={20} style={{ color: 'currentColor' }} />
                    {tiradas.length === 0
                      ? 'Tirar Dado'
                      : tiradas.length >= 6
                        ? 'Reiniciar'
                        : 'Volver a tirar'}
                  </button>
                  {tiradas.length > 0 && (
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      {tiradas.map(t => (
                        <span
                          key={t.id}
                          className={`create-tirada-tag ${idsUsados.includes(t.id) ? 'used' : ''}`}
                          draggable
                          onDragStart={() => { dragPayload.current = { source: 'pool-dados', id: t.id }; }}
                          onDragEnd={() => setDragOverStat(null)}
                        >
                          {t.valor}
                        </span>
                      ))}
                      {tiradas.length < 6 && (
                        <span className="create-tirada-tag create-tirada-tag--pending">
                          {6 - tiradas.length} restante{6 - tiradas.length > 1 ? 's' : ''}
                        </span>
                      )}
                      <small className="text-muted ms-1 align-self-center">{idsUsados.length}/6 asignados</small>
                    </div>
                  )}
                </div>
                {tiradas.length > 0 && (
                  <div className="row g-3">
                    {STATS.map(stat => (
                      <div className="col-md-4" key={stat}>
                        <div
                          className={`create-stat-box ${dragOverStat === stat ? 'drag-over' : ''}`}
                          onDragOver={e => { e.preventDefault(); setDragOverStat(stat); }}
                          onDragLeave={() => setDragOverStat(null)}
                          onDrop={() => handleDropOnStat(stat)}
                          draggable={tiradaAsignada[stat] !== null}
                          onDragStart={() => { if (tiradaAsignada[stat] !== null) dragPayload.current = { source: 'stat-dados', stat }; }}
                          onDragEnd={() => setDragOverStat(null)}
                        >
                          <span className="create-stat-label">{STAT_LABELS[stat]}</span>
                          <select className="form-select create-input text-center"
                            value={tiradaAsignada[stat] ?? ''}
                            onChange={e => asignarTirada(stat, e.target.value === '' ? null : Number(e.target.value))}>
                            <option value="">— Elige —</option>
                            {tiradas.map(t => (
                              <option key={t.id} value={t.id} disabled={idsUsados.includes(t.id) && tiradaAsignada[stat] !== t.id}>
                                {t.valor}{idsUsados.includes(t.id) && tiradaAsignada[stat] !== t.id ? ' (en uso)' : ''}
                              </option>
                            ))}
                          </select>
                          {razaData && (razaData.bonuses as any)[stat] && (
                            <span className="create-race-bonus">+{(razaData.bonuses as any)[stat]} raza</span>
                          )}
                          <span className="create-stat-final">
                            {tiradaAsignada[stat] !== null
                              ? <>{statsFinal[stat]} <small>{calcularModificador(statsFinal[stat])}</small></>
                              : <small className="text-muted">—</small>}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="create-ataques-block mt-4">
              <h5 className="create-subsection-title">Ataques y Conjuros</h5>
              <p className="create-method-desc">Agrega lo que tu personaje sabe usar o lanzar.</p>
              <div className="row g-3 mt-2">
                <div className="col-md-3">
                  <label className="create-label">Tipo</label>
                  <select
                    className="form-select create-input"
                    value={entryTipo}
                    onChange={(e) => setEntryTipo(e.target.value as EntryTipo)}
                  >
                    <option value="ataque">Ataque</option>
                    <option value="conjuro">Conjuro</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="create-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control create-input"
                    placeholder="Ej: Espada larga"
                    value={entryNombre}
                    onChange={(e) => setEntryNombre(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="create-label">Bonificador</label>
                  <input
                    type="text"
                    className="form-control create-input"
                    placeholder="Ej: +5"
                    value={entryBonificador}
                    onChange={(e) => setEntryBonificador(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="create-label">Daño</label>
                  <input
                    type="text"
                    className="form-control create-input"
                    placeholder="Ej: 1d8 + Fue"
                    value={entryDano}
                    onChange={(e) => setEntryDano(e.target.value)}
                  />
                </div>
                  <div className="col-md-2">
                    <label className="create-label">Rango</label>
                    <input
                      type="number"
                      min={1}
                      className="form-control create-input"
                      placeholder="Casillas"
                      value={entryRango}
                      onChange={(e) => setEntryRango(Number(e.target.value))}
                    />
                  </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn create-btn-primary" onClick={addEntry}>
                  Agregar
                </button>
              </div>
              <div className="create-ataques-table mt-3">
                <div className="create-ataques-row create-ataques-header">
                  <span>Nombre</span>
                  <span>Bonif.</span>
                  <span>Daño</span>
                  <span>Rango</span>
                  <span></span>
                </div>
                {attackSpellEntries.length === 0
                  ? [1, 2].map(i => (
                      <div key={`empty-${i}`} className="create-ataques-row">
                        <span>—</span><span>—</span><span>—</span><span>—</span><span></span>
                      </div>
                    ))
                  : attackSpellEntries.map(entry => (
                      <div key={entry.id} className="create-ataques-row">
                        <span>{entry.tipo === 'conjuro' ? `Conjuro: ${entry.nombre}` : entry.nombre}</span>
                        <span>{entry.bonificador}</span>
                        <span>{entry.dano}</span>
                        <span>{entry.rangoCasillas ?? (entry.tipo === 'conjuro' ? 6 : 1)} casillas</span>
                        <span>
                          <button
                            type="button"
                            className="create-ataques-delete"
                            onClick={() => removeEntry(entry.id)}
                            aria-label={`Eliminar ${entry.nombre}`}
                          >
                            ✕
                          </button>
                        </span>
                      </div>
                    ))}
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn create-btn-secondary" onClick={() => setPaso(1)}>← Atrás</button>
              <button className="btn create-btn-primary" disabled={!paso2Valido} onClick={() => setPaso(3)}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ══ PASO 3: APARIENCIA ══ */}
        {paso === 3 && (
          <div className="create-card">
            <h4 className="create-section-title mb-2">
               <ColorsSwatch width={20} height={20} style={{ color: 'currentColor' }} /> Apariencia del Personaje
              </h4>
            <p className="create-method-desc mb-4">
              Selecciona un avatar para tu <strong>{raza} {clase}</strong>.
            </p>

            <div className="row g-4 align-items-start">
              <div className="col-lg-8">
                <div className="avatars-grid">
                  {avatarsDisponibles.map(avatarId => (
                    <button
                      key={avatarId}
                      type="button"
                      className={`avatar-option ${avatarSeleccionado === avatarId ? 'active' : ''}`}
                      onClick={() => seleccionarAvatar(avatarId)}
                    >
                      <img
                        src={getAvatarUrl(avatarId)}
                        alt={avatarId}
                        className="avatar-option-img"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                <p className="create-method-desc mt-3 mb-0">
                  Solo se muestran avatares de la clase seleccionada: <strong>{claseApariencia}</strong>
                </p>
              </div>

              <div className="col-lg-4">
                <div className="avatar-preview-card">
                  <div className="avatar-preview-img-wrap">
                    {imagenFinal
                      ? <img src={imagenFinal} alt="carta" className="avatar-preview-img" />
                      : <div className="avatar-preview-empty">Sin selección</div>
                    }
                  </div>
                  <h3 className="avatar-preview-name mt-3">{nombre}</h3>
                  <p className="text-muted text-center small">{raza} · {clase}</p>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn create-btn-secondary" onClick={() => setPaso(2)}>← Atrás</button>
              <button className="btn create-btn-primary" disabled={!paso3Valido} onClick={() => setPaso(4)}>
                Ver Ficha Final →
              </button>
            </div>
          </div>
        )}

        {paso === 4 && (
                <CharacterSheet
                  nombre={nombre}
                  raza={raza}
                  clase={clase}
                  trasfondo={trasfondo}
                  historia={historia}
                  imagen={imagenFinal}
                  stats={statsFinal}
                  puntosGolpeMax={puntosGolpeMax ?? undefined}
                  entradasAtaquesConjuros={attackSpellEntries}
                  mostrarFormularioAtaques={false}
                  modo="wizard"
                  onVolver={() => setPaso(3)}
                  onConfirmar={handleConfirmar}
                />
              )}
      
            </div>
    </div>

    <DiceRoller
      dado={d20Dado}
      resultado={d20Resultado}
      onAnimacionFin={handleD20AnimacionFin}
      containerId="dice-box-create"
    />
    </>
  );
}
