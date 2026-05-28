import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CharacterCreate.css';
import { BackButton } from '../../components/BackButton/BackButton';
import { CharacterSheet } from './CharacterSheet';
import { getCartaUrl } from '../../utils/imageUtils';
import { createPersonaje, type PersonajeCreatePayload } from '../../services/personajeService';
import { DiceRoller } from '../Tablero/DiceRoller';
import { RAZAS, TRASFONDOS, GENEROS } from './constants';
import { STATS } from './types';
import { calcularPuntosGolpeMax, normalizarClase, contarPalabras, normalizarTexto, normalizarStatsBaseBackend } from './utils';
import { useStatAssignment } from './hooks/useStatAssignment';
import { useAttackEntries } from './hooks/useAttackEntries';
import { StepIdentity } from './components/StepIdentity';
import { StepStats } from './components/StepStats';
import { StepAvatar } from './components/StepAvatar';

const DRAFT_KEY = 'rc:character-create-draft';
const readDraft = (): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const PASOS = ['Identidad', 'Características', 'Apariencia', 'Ficha Final'];

export function CharacterCreate() {
  const navigate = useNavigate();
  const d = useRef(readDraft()).current;
  const initialAttackEntries = useRef(Array.isArray(d?.attackSpellEntries) ? d.attackSpellEntries : []).current;

  const [paso, setPaso] = useState<number>(d?.paso ?? 1);
  const [nombre, setNombre] = useState<string>(d?.nombre ?? '');
  const [raza, setRaza] = useState<string>(d?.raza ?? '');
  const [clase, setClase] = useState<string>(d?.clase ?? '');
  const [trasfondo, setTrasfondo] = useState<string>(d?.trasfondo ?? '');
  const [historia, setHistoria] = useState<string>(d?.historia ?? '');
  const [metodo, setMetodo] = useState<'puntos' | 'dados'>(d?.metodo ?? 'puntos');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState<string | null>(d?.avatarSeleccionado ?? null);
  const [guardando, setGuardando] = useState(false);

  const razaData = RAZAS.find(r => r.nombre === raza);
  const trasfondoData = TRASFONDOS.find(t => t.nombre === trasfondo);
  const palabras = contarPalabras(historia);
  const claseApariencia = clase ? normalizarClase(clase) : normalizarClase('Bárbaro');
  const avatarsDisponibles = GENEROS.map(genero => `${claseApariencia}${genero}`);

  const statAssignment = useStatAssignment(metodo, razaData, {
    initialStatsEstandar: d?.statsEstandar,
    initialTiradas: d?.tiradas,
    initialTiradaAsignada: d?.tiradaAsignada,
  });

  const { statsFinal, statsBase } = statAssignment;

  const nivelInicial = 1;
  const puntosGolpeMax = clase ? calcularPuntosGolpeMax(clase, statsFinal.constitucion, nivelInicial) : null;

  const attackEntries = useAttackEntries(initialAttackEntries);
  const { attackSpellEntries } = attackEntries;

  const imagenFinal = avatarSeleccionado ? getCartaUrl(avatarSeleccionado) : null;

  const handleHistoria = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (contarPalabras(e.target.value) <= 120) setHistoria(e.target.value);
  };

  const handleCambiarMetodo = (nuevoMetodo: 'puntos' | 'dados') => {
    setMetodo(nuevoMetodo);
    statAssignment.resetAll();
  };

  const paso1Valido = !!(nombre.trim() && raza && clase && trasfondo);
  const paso2Valido = metodo === 'puntos'
    ? STATS.every(s => statAssignment.statsEstandar[s] !== null)
    : STATS.every(s => statAssignment.tiradaAsignada[s] !== null);
  const paso3Valido = avatarSeleccionado !== null;

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
      statsBase: statsBaseBackend,
      statsFinales: statsFinal,
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
        if (keyBase) localStorage.setItem(`rc:attacks-spells:${keyBase}`, JSON.stringify(attackSpellEntries));
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate('/mis-personajes');
    } catch (error) {
      console.error('Error creando personaje:', error);
      alert('No se pudo guardar el personaje. Revisa los datos e intentalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (paso > 1) { setPaso(p => p - 1); window.history.pushState(null, '', window.location.href); }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [paso]);

  useEffect(() => {
    const avatarPorDefecto = `${claseApariencia}Male`;
    setAvatarSeleccionado(prev => {
      if (prev && prev.startsWith(claseApariencia)) return prev;
      return avatarPorDefecto;
    });
  }, [claseApariencia]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      paso, nombre, raza, clase, trasfondo, historia, metodo,
      statsEstandar: statAssignment.statsEstandar,
      tiradas: statAssignment.tiradas,
      tiradaAsignada: statAssignment.tiradaAsignada,
      attackSpellEntries, avatarSeleccionado,
    }));
  }, [paso, nombre, raza, clase, trasfondo, historia, metodo,
      statAssignment.statsEstandar, statAssignment.tiradas, statAssignment.tiradaAsignada,
      attackSpellEntries, avatarSeleccionado]);

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

          {paso === 1 && (
            <StepIdentity
              nombre={nombre} raza={raza} clase={clase} trasfondo={trasfondo}
              historia={historia} palabras={palabras}
              setNombre={setNombre} setRaza={setRaza} setClase={setClase}
              setTrasfondo={setTrasfondo} handleHistoria={handleHistoria}
              paso1Valido={paso1Valido} onNext={() => setPaso(2)}
            />
          )}

          {paso === 2 && (
            <StepStats
              metodo={metodo} onCambiarMetodo={handleCambiarMetodo}
              statAssignment={statAssignment}
              attackEntries={attackEntries}
              razaData={razaData}
              paso2Valido={paso2Valido}
              onBack={() => setPaso(1)} onNext={() => setPaso(3)}
            />
          )}

          {paso === 3 && (
            <StepAvatar
              raza={raza} clase={clase} nombre={nombre}
              claseApariencia={claseApariencia} avatarsDisponibles={avatarsDisponibles}
              avatarSeleccionado={avatarSeleccionado} imagenFinal={imagenFinal}
              onSelect={setAvatarSeleccionado}
              paso3Valido={paso3Valido}
              onBack={() => setPaso(2)} onNext={() => setPaso(4)}
            />
          )}

          {paso === 4 && (
            <CharacterSheet
              nombre={nombre} raza={raza} clase={clase}
              trasfondo={trasfondo} historia={historia}
              imagen={imagenFinal} stats={statsFinal}
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
        dado={statAssignment.d20Dado}
        resultado={statAssignment.d20Resultado}
        onAnimacionFin={statAssignment.handleD20AnimacionFin}
        containerId="dice-box-create"
      />
    </>
  );
}
