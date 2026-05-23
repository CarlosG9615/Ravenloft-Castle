import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CharacterSheet.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { getPersonaje, deletePersonaje } from '../../services/personajeService';
import { getCartaUrl } from '../../utils/imageUtils';
import { BookOpen, Sword } from 'pixelarticons/react';
import { STAT_LABELS, TRASFONDOS_MAP, HABILIDADES, DEFAULT_STATS } from './constants';
import { calcMod, isAbsoluteUrl, isDataUrl, normalizeEntry } from './utils';
import { useCharacterAttacks } from './hooks/useCharacterAttacks';
import { DiarioCampana } from './components/DiarioCampana';
import type { Stats, AttackSpellEntry, PersonajeResponseDTO } from './types';

export type { AttackSpellEntry };
export type { EntryTipo } from './types';

interface CharacterSheetProps {
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
  onVolver?: () => void;
  onConfirmar?: () => void;
  modo?: 'wizard' | 'view';
}

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
  const [entriesKey, setEntriesKey] = useState<string | null>(null);

  const allowEdits = mostrarFormularioAtaques;

  useEffect(() => {
    if (modo !== 'view' || !id) return;
    const load = async () => {
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
    load();
  }, [id, modo]);

  const resolveCartaUrl = (avatarValue?: string | null) => {
    if (!avatarValue) return null;
    if (isAbsoluteUrl(avatarValue) || isDataUrl(avatarValue)) return avatarValue;
    return getCartaUrl(avatarValue);
  };

  const nombreFinal = personaje?.nombre ?? nombre;
  const razaFinal   = personaje?.raza ?? raza;
  const claseFinal  = personaje?.clase ?? clase;
  const alineamientoFinal = personaje?.alineamiento ?? '—';
  const imagenFinal = modo === 'view' ? resolveCartaUrl(personaje?.avatar) : imagen;

  const statsFinales = useMemo<Stats>(() => (
    personaje
      ? { fuerza: personaje.fuerza, destreza: personaje.destreza, constitucion: personaje.constitucion,
          inteligencia: personaje.inteligencia, sabiduria: personaje.sabiduria, carisma: personaje.carisma }
      : stats
  ), [personaje, stats]);

  const trasfondoData = TRASFONDOS_MAP[trasfondo];
  const competencias = trasfondoData?.competencias ?? [];
  const bonifComp = personaje?.bonificacionCompetencia ?? 2;

  useEffect(() => {
    if (modo !== 'view') { setEntriesKey(null); return; }
    const keyBase = personaje?.id ?? nombreFinal;
    setEntriesKey(keyBase ? `rc:attacks-spells:${keyBase}` : null);
  }, [modo, personaje?.id, nombreFinal]);

  const attacksHook = useCharacterAttacks(
    modo, entriesKey, claseFinal, statsFinales, bonifComp, entradasAtaquesConjuros
  );

  const {
    attacks, spells,
    entryTipo, entryNombre, entryBonificador, entryDano,
    setEntryTipo, setEntryNombre, setEntryBonificador, setEntryDano,
    editingEntryId, editingNombre, editingBonificador, editingDano,
    setEditingNombre, setEditingBonificador, setEditingDano,
    addEntry, startEditEntry, saveEditEntry, handleEditKeyDown,
  } = attacksHook;

  const combate = [
    { label: 'Puntos de Golpe', valor: personaje?.puntosGolpeMax?.toString() ?? (typeof puntosGolpeMax === 'number' ? puntosGolpeMax.toString() : '—') },
    { label: 'Iniciativa',     valor: personaje?.iniciativa?.toString() ?? calcMod(statsFinales.destreza) },
    { label: 'Nivel',          valor: personaje?.nivel?.toString() ?? '1' },
    { label: 'Velocidad',      valor: personaje?.velocidad ? `${personaje.velocidad} pies` : '30 pies' },
    { label: 'Clase Armadura', valor: personaje?.claseArmadura?.toString() ?? '10' },
    { label: 'Bonif. Comp.',   valor: personaje?.bonificacionCompetencia ? `+${personaje.bonificacionCompetencia}` : '+2' },
  ];

  const handlePrint = () => {
    const body = document.body;
    const hadAccessibility = body.classList.contains('accessibility-enabled');
    if (hadAccessibility) body.classList.remove('accessibility-enabled');
    body.setAttribute('data-print-tab', tab);
    const cleanup = () => {
      body.removeAttribute('data-print-tab');
      if (hadAccessibility) body.classList.add('accessibility-enabled');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este personaje? Esta acción es irreversible.')) return;
    try {
      await deletePersonaje(Number(id));
      navigate('/mis-personajes');
    } catch (err) {
      console.error('Error al eliminar personaje:', err);
      alert('Hubo un error al eliminar el personaje.');
    }
  };

  const renderAttacksAndSpells = () => {
    const rows = [...attacks, ...spells];
    if (rows.length === 0) {
      return [1, 2, 3, 4].map(i => (
        <div key={`empty-${i}`} className="sf-ataques-row">
          <span>—</span><span>—</span><span>—</span>
        </div>
      ));
    }
    return rows.map(entry => (
      <div key={entry.id} className={`sf-ataques-row ${entry.tipo === 'conjuro' ? 'sf-ataques-row--spell' : ''}`}>
        <span>
          {allowEdits && editingEntryId === entry.id
            ? <input className="sf-ataques-inline-input" type="text" value={editingNombre}
                onChange={e => setEditingNombre(e.target.value)} onKeyDown={handleEditKeyDown} />
            : (entry.tipo === 'conjuro' ? `Conjuro: ${entry.nombre}` : entry.nombre)}
        </span>
        <span>
          {allowEdits && editingEntryId === entry.id
            ? <input className="sf-ataques-inline-input" type="text" value={editingBonificador}
                onChange={e => setEditingBonificador(e.target.value)} onKeyDown={handleEditKeyDown} />
            : entry.bonificador}
        </span>
        <span className="sf-ataques-dano">
          {allowEdits && editingEntryId === entry.id
            ? <input className="sf-ataques-inline-input" type="text" value={editingDano}
                onChange={e => setEditingDano(e.target.value)} onKeyDown={handleEditKeyDown} />
            : entry.dano}
          {allowEdits && (
            <button type="button" className="sf-ataques-edit-btn"
              onClick={() => (editingEntryId === entry.id ? saveEditEntry() : startEditEntry(entry))}
              aria-label={editingEntryId === entry.id ? `Guardar ${entry.nombre}` : `Editar ${entry.nombre}`}
              title={editingEntryId === entry.id ? 'Guardar cambios' : 'Editar'}
            >
              <i className={`bi ${editingEntryId === entry.id ? 'bi-check2' : 'bi-pencil'}`} />
            </button>
          )}
        </span>
      </div>
    ));
  };

  if (modo === 'view' && loading) {
    return (
      <div className="sf-page">
        <div className="sf-actions no-print"><BackButton /></div>
        <div className="container py-5 text-center text-light">Cargando personaje...</div>
      </div>
    );
  }

  if (modo === 'view' && error) {
    return (
      <div className="sf-page">
        <div className="sf-actions no-print"><BackButton /></div>
        <div className="container py-5 text-center text-light">{error}</div>
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
          <div className="sf-marco-elfico" />

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

          <div className="sf-cuerpo">
            {/* COLUMNA IZQ */}
            <div className="sf-col-izq">
              <h3 className="sf-titulo-seccion">Características</h3>
              {Object.entries(statsFinales).map(([stat, valor]) => (
                <div key={stat} className="sf-stat-row">
                  <span className="sf-stat-nombre">{STAT_LABELS[stat as keyof typeof STAT_LABELS]}</span>
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
                <button className="sf-btn sf-btn-delete no-print w-100" onClick={handleDelete}
                  style={{ marginTop: 'auto', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                { label: 'Trasfondo',    valor: trasfondo || '—' },
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
                    {competencias.map(c => <span key={c} className="sf-comp-tag">{c}</span>)}
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

              {allowEdits && (
                <div className="sf-ataques-form">
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Tipo</label>
                    <select className="sf-ataques-input" value={entryTipo}
                      onChange={e => setEntryTipo(e.target.value as typeof entryTipo)}>
                      <option value="ataque">Ataque</option>
                      <option value="conjuro">Conjuro</option>
                    </select>
                  </div>
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Nombre</label>
                    <input className="sf-ataques-input" type="text" value={entryNombre}
                      onChange={e => setEntryNombre(e.target.value)} placeholder="Ej: Espada larga" />
                  </div>
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Bonificador</label>
                    <input className="sf-ataques-input" type="text" value={entryBonificador}
                      onChange={e => setEntryBonificador(e.target.value)} placeholder="Ej: +5" />
                  </div>
                  <div className="sf-ataques-form-row">
                    <label className="sf-ataques-label">Daño</label>
                    <input className="sf-ataques-input" type="text" value={entryDano}
                      onChange={e => setEntryDano(e.target.value)} placeholder="Ej: 1d8 + Fue" />
                  </div>
                  <div className="sf-ataques-form-actions">
                    <button type="button" className="sf-btn" onClick={addEntry}>Agregar</button>
                  </div>
                </div>
              )}

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

      {tab === 'diario' && <DiarioCampana nombre={nombreFinal} />}
    </div>
  );
}
