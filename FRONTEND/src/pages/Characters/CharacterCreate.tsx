import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CharacterCreate.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { CharacterSheet } from './CharacterSheet';

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

const calcMod = (val: number) => {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

const tirar4d6 = () => {
  const dados = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  dados.sort((a, b) => a - b);
  return dados.slice(1).reduce((a, b) => a + b, 0);
};

const contarPalabras = (texto: string) =>
  texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;

// ── COMPONENTE ────────────────────────────────────────────
export function CharacterCreate() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);

  // Paso 1
  const [nombre, setNombre] = useState('');
  const [raza, setRaza] = useState('');
  const [clase, setClase] = useState('');
  const [trasfondo, setTrasfondo] = useState('');
  const [historia, setHistoria] = useState('');

  // Paso 2
  const [metodo, setMetodo] = useState<'puntos' | 'dados'>('puntos');
  const [statsEstandar, setStatsEstandar] = useState<Record<StatKey, number | null>>({
    fuerza: null, destreza: null, constitucion: null,
    inteligencia: null, sabiduria: null, carisma: null,
  });
  const [tiradas, setTiradas] = useState<{ id: number; valor: number }[]>([]);
  const [tiradaAsignada, setTiradaAsignada] = useState<Record<StatKey, number | null>>({
    fuerza: null, destreza: null, constitucion: null,
    inteligencia: null, sabiduria: null, carisma: null,
  });

  // Paso 3
  const [avatarSeleccionado, setAvatarSeleccionado] = useState<string | null>(null);
  const [avatarCustom, setAvatarCustom] = useState<string | null>(null);

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

  const palabras = contarPalabras(historia);
  const imagenFinal = avatarCustom ?? (avatarSeleccionado ? `/images/avatars/${avatarSeleccionado}.png` : null);

  const handleHistoria = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (contarPalabras(e.target.value) <= MAX_PALABRAS) setHistoria(e.target.value);
  };

  const asignarPuntoEstandar = (stat: StatKey, valor: number | null) =>
    setStatsEstandar(prev => ({ ...prev, [stat]: valor }));

  const valoresUsados = (statActual: StatKey) =>
    STATS.filter(s => s !== statActual).map(s => statsEstandar[s]).filter(v => v !== null) as number[];

  const generarTiradas = () => {
    setTiradas(Array.from({ length: 6 }, (_, i) => ({ id: i, valor: tirar4d6() })));
    setTiradaAsignada({ fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null });
  };

  const idsUsados = Object.values(tiradaAsignada).filter(v => v !== null) as number[];

  const asignarTirada = (stat: StatKey, idTirada: number | null) =>
    setTiradaAsignada(prev => ({ ...prev, [stat]: idTirada }));

  const cambiarMetodo = (nuevoMetodo: 'puntos' | 'dados') => {
    setMetodo(nuevoMetodo);
    setStatsEstandar({ fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null });
    setTiradas([]);
    setTiradaAsignada({ fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarCustom(reader.result as string);
      setAvatarSeleccionado(null);
    };
    reader.readAsDataURL(file);
  };

  const paso1Valido = nombre.trim() && raza && clase && trasfondo;
  const paso2Valido = metodo === 'puntos'
    ? STATS.every(s => statsEstandar[s] !== null)
    : STATS.every(s => tiradaAsignada[s] !== null);
  const paso3Valido = avatarSeleccionado !== null || avatarCustom !== null;

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

  const PASOS = ['Identidad', 'Características', 'Apariencia', 'Ficha Final'];

  return (
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
            <h4 className="create-section-title mb-4">📜 Identidad del Personaje</h4>
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
                  📊 Asignación Estándar
                </button>
                <button className={`btn create-method-btn ${metodo === 'dados' ? 'active' : ''}`} onClick={() => cambiarMetodo('dados')}>
                  🎲 Tirada de Dados
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
                  {PUNTOS_ESTANDAR.map(p => (
                    <span key={p} className={`create-tirada-tag ${Object.values(statsEstandar).includes(p) ? 'used' : ''}`}>{p}</span>
                  ))}
                  <small className="text-muted ms-2 align-self-center">
                    {STATS.filter(s => statsEstandar[s] !== null).length}/6 asignados
                  </small>
                </div>
                <div className="row g-3">
                  {STATS.map(stat => (
                    <div className="col-md-4" key={stat}>
                      <div className="create-stat-box">
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
                            ? <>{statsFinal[stat]} <small>{calcMod(statsFinal[stat])}</small></>
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
                <div className="d-flex align-items-center gap-3 mb-4">
                  <button className="btn create-btn-primary" onClick={generarTiradas}>
                    🎲 {tiradas.length > 0 ? 'Volver a tirar' : 'Tirar Dados'}
                  </button>
                  {tiradas.length > 0 && (
                    <div className="d-flex gap-2 flex-wrap">
                      {tiradas.map(t => (
                        <span key={t.id} className={`create-tirada-tag ${idsUsados.includes(t.id) ? 'used' : ''}`}>{t.valor}</span>
                      ))}
                      <small className="text-muted ms-1 align-self-center">{idsUsados.length}/6 asignados</small>
                    </div>
                  )}
                </div>
                {tiradas.length > 0 && (
                  <div className="row g-3">
                    {STATS.map(stat => (
                      <div className="col-md-4" key={stat}>
                        <div className="create-stat-box">
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
                              ? <>{statsFinal[stat]} <small>{calcMod(statsFinal[stat])}</small></>
                              : <small className="text-muted">—</small>}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

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
            <h4 className="create-section-title mb-2">🎨 Apariencia del Personaje</h4>
            <p className="create-method-desc mb-4">
              Selecciona un avatar para tu <strong>{raza} {clase}</strong> o sube tu propia imagen.
            </p>

            <div className="create-upload-area mb-4">
              <label className="create-upload-label" htmlFor="uploadAvatar">
                {avatarCustom
                  ? '✅ Imagen personalizada cargada — haz clic para cambiarla'
                  : '📁 Subir mi propia imagen'}
              </label>
              <input id="uploadAvatar" type="file" accept="image/*" className="d-none" onChange={handleUpload} />
            </div>

            <div className="row g-4 align-items-start">
              <div className="col-lg-8">
                <div className="avatars-grid">
                  {/* Los avatares filtrados se añadirán aquí cuando estén las imágenes */}
                  <div className="create-avatar-placeholder-grid">
                    <p className="text-muted text-center">
                      Los avatares de <strong>{raza} · {clase}</strong> aparecerán aquí.
                    </p>
                    <p className="text-muted text-center small">Por ahora usa la opción de subir tu propia imagen.</p>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="avatar-preview-card">
                  <div className="avatar-preview-img-wrap">
                    {imagenFinal
                      ? <img src={imagenFinal} alt="avatar" className="avatar-preview-img" />
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
          {/* ══ PASO 4: FICHA FINAL ══ */}
              {paso === 4 && (
                <CharacterSheet
                  nombre={nombre}
                  raza={raza}
                  clase={clase}
                  trasfondo={trasfondo}
                  historia={historia}
                  imagen={imagenFinal}
                  stats={statsFinal}
                  modo="wizard"
                  onVolver={() => setPaso(3)}
                  onConfirmar={() => navigate('/characters')}
                />
              )}
      
            </div>
    </div>
  );
}