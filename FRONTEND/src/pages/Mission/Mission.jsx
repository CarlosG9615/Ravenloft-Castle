import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../../components/BackButton/BackButton';
import { CharacterSelectModal } from '../../components/CharacterSelectModal/CharacterSelectModal';
import { API_URL, authHeaders } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { getPersonajes } from '../../services/personajeService';
import { getAvatarUrl, getCartaUrl } from '../../utils/imageUtils';
import { obtenerNarrativaMision } from './missionNarrative';
import './Mission.css';

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);
const isDataUrl = (value) => /^data:/i.test(value);
const isAppPath = (value) => value?.startsWith?.('/') ?? false;

const resolveAvatarUrl = (avatar) => {
	if (!avatar) return '/images/avatars/default.png';
	if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
	return getCartaUrl(avatar);
};

const resolveAvatarPreviewUrl = (avatar) => {
	if (!avatar) return '/images/avatars/default.png';
	if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
	return getAvatarUrl(avatar);
};

// Función para normalizar strings con acentos
const normalizeString = (str) => {
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
};

// Función para calcular color basado en clase
const getColorForClase = (clase) => {
	if (!clase) return '#4a90d9';
	
	const claseNorm = normalizeString(clase);
	
	if (claseNorm.includes('guerrero') || claseNorm.includes('barbaro') || claseNorm.includes('paladin')) {
		return '#C0392B'; // Rojo
	}
	if (claseNorm.includes('mago') || claseNorm.includes('hechicero') || claseNorm.includes('brujo')) {
		return '#2980B9'; // Azul
	}
	if (claseNorm.includes('clerigo') || claseNorm.includes('druida')) {
		return '#27AE60'; // Verde
	}
	if (claseNorm.includes('picaro') || claseNorm.includes('explorador') || claseNorm.includes('bardo')) {
		return '#8E44AD'; // Púrpura
	}
	if (claseNorm.includes('monje')) {
		return '#E67E22'; // Naranja
	}
	
	return '#4a90d9'; // Default azul
};

const STAT_LABELS = {
	fuerza: 'Fuerza',
	destreza: 'Destreza',
	constitucion: 'Constitución',
	inteligencia: 'Inteligencia',
	sabiduria: 'Sabiduría',
	carisma: 'Carisma',
};

const STAT_KEYS = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'];

const getStatValue = (personaje, statKey) => {
	if (!personaje) return '-';

	const desdeFinales = personaje?.statsFinales?.[statKey];
	if (typeof desdeFinales === 'number') return desdeFinales;

	const desdeBase = personaje?.statsBase?.[statKey];
	if (typeof desdeBase === 'number') return desdeBase;

	const plano = personaje?.[statKey];
	if (typeof plano === 'number') return plano;

	return '-';
};

const getMissionName = (mision, fallback = 'Mision') => {
	const candidates = [
		mision?.nombre,
		mision?.titulo,
		mision?.nombreMision,
		mision?.misionNombre,
		mision?.name,
		mision?.title,
	];

	const encontrado = candidates.find(value => typeof value === 'string' && value.trim().length > 0);
	return encontrado ?? fallback;
};

const DIFICULTAD_COLOR = {
	'Fácil': '#2ecc71',
	'Media': '#f39c12',
	'Difícil': '#e74c3c',
	'Épica': '#9b59b6',
};

const getDificultadColor = (dificultad) => {
	const normalizada = (dificultad ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toUpperCase();

	if (normalizada === 'FACIL') return DIFICULTAD_COLOR['Fácil'];
	if (normalizada === 'MEDIA') return DIFICULTAD_COLOR.Media;
	if (normalizada === 'DIFICIL') return DIFICULTAD_COLOR['Difícil'];
	if (normalizada === 'EPICA') return DIFICULTAD_COLOR['Épica'];

	return 'rgba(90, 90, 90, 0.95)';
};

export function Mission() {
	const { id: modoHistoriaId, misionId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state || {};
	const modoHistoria = state?.modoHistoria ?? null;
	const [mision, setMision] = useState(state.mision ?? null);
	const [cargando, setCargando] = useState(!state.mision);
	const [error, setError] = useState(null);
	const [misionesModoHistoria, setMisionesModoHistoria] = useState(
		Array.isArray(modoHistoria?.misiones) ? modoHistoria.misiones : []
	);
	const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
	const [personajes, setPersonajes] = useState([]);
	const [personajesCargando, setPersonajesCargando] = useState(false);
	const [personajesError, setPersonajesError] = useState(null);
	const [entrandoConPersonajeCargando, setEntrandoConPersonajeCargando] = useState(false);
	const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null);
	const [showNivelInsuficienteModal, setShowNivelInsuficienteModal] = useState(false);
	const [nivelCampanaRequerido, setNivelCampanaRequerido] = useState(1);
	const [misionesSugeridas, setMisionesSugeridas] = useState([]);
	const [todosModosHistoria, setTodosModosHistoria] = useState([]);
	const statsPersonajeSeleccionado = useMemo(
		() => STAT_KEYS.map(statKey => ({
			key: statKey,
			label: STAT_LABELS[statKey],
			value: getStatValue(personajeSeleccionado, statKey),
		})),
		[personajeSeleccionado]
	);

	const misionIdNumero = useMemo(() => Number(misionId), [misionId]);
	const { user } = useAuth();

	useEffect(() => {
		if (!Number.isFinite(misionIdNumero) || misionIdNumero <= 0) {
			setError('ID de mision invalido.');
			setCargando(false);
			return;
		}

		const controller = new AbortController();

		const cargarMision = async () => {
			setCargando(true);
			setError(null);

			try {
				const response = await fetch(`${API_URL}/api/misiones/${misionIdNumero}`, {
					signal: controller.signal,
					headers: authHeaders(),
				});

				if (!response.ok) {
					throw new Error(`No se pudo cargar la mision (${response.status})`);
				}

				const payload = await response.json();
				setMision(payload);
			} catch (e) {
				if (controller.signal.aborted) return;
				setError(e instanceof Error ? e.message : 'Error cargando la mision.');
			} finally {
				if (!controller.signal.aborted) {
					setCargando(false);
				}
			}
		};

		cargarMision();

		return () => controller.abort();
	}, [misionIdNumero]);

	useEffect(() => {
		if (!modoHistoriaId || !Number.isFinite(Number(modoHistoriaId)) || Number(modoHistoriaId) <= 0) {
			return;
		}

		if (Array.isArray(modoHistoria?.misiones) && modoHistoria.misiones.length > 0) {
			setMisionesModoHistoria(modoHistoria.misiones);
			return;
		}

		const controller = new AbortController();

		const cargarCapitulos = async () => {
			try {
				const response = await fetch(`${API_URL}/api/modos-historia/${modoHistoriaId}/misiones`, {
					signal: controller.signal,
					headers: authHeaders(),
				});

				if (!response.ok) return;

				const payload = await response.json();
				if (Array.isArray(payload)) {
					setMisionesModoHistoria(payload);
				}
			} catch (e) {
				if (controller.signal.aborted) return;
			}
		};

		cargarCapitulos();

		return () => controller.abort();
	}, [modoHistoria?.misiones, modoHistoriaId]);

	const numeroCapitulo = mision?.orden ?? state?.mision?.orden ?? '-';
	const tituloMision = getMissionName(mision, getMissionName(state?.mision, `Mision ${misionId ?? '-'}`));
	const narrativa = useMemo(() => obtenerNarrativaMision(mision ?? state?.mision ?? {}), [mision, state]);

	const capitulos = useMemo(() => {
		if (Array.isArray(misionesModoHistoria) && misionesModoHistoria.length > 0) {
			return misionesModoHistoria
				.map((item, index) => ({
					id: Number(item.id),
					orden: item.orden ?? index + 1,
					nombre: getMissionName(item, `Mision ${item.id ?? index + 1}`),
					descripcion: item.descripcion,
					nivelMinimo: item.nivelMinimo,
					dificultad: item.dificultad,
					xpRecompensa: item.xpRecompensa,
					completada: item.completada,
				}))
				.filter(item => Number.isFinite(item.id) && item.id > 0)
				.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
		}

		if (mision?.id) {
			return [{ id: mision.id, orden: mision.orden ?? 1 }];
		}

		return [];
	}, [mision?.id, mision?.orden, misionesModoHistoria]);

	const irACapitulo = capitulo => {
		if (!modoHistoriaId || !capitulo?.id || capitulo.id === misionIdNumero) return;

		navigate(`/story-mode/${modoHistoriaId}/${capitulo.id}`, {
			state: {
				modoHistoria,
				mision: {
					id: capitulo.id,
					nombre: capitulo.nombre,
					descripcion: capitulo.descripcion,
					orden: capitulo.orden,
					dificultad: capitulo.dificultad,
					xpRecompensa: capitulo.xpRecompensa,
					completada: capitulo.completada,
				},
			},
		});
	};

	const modosJuego = [
		{
			titulo: 'Juega como Master',
			descripcion: 'Accede a todo lo necesario para gestionar la partida, desplegar escenas, animar el ritmo de la aventura y preparar cada momento para que los personajes se lancen a la exploracion con claridad y tension narrativa.',
			variant: 'master',
		},
		{
			titulo: 'Juega como Personaje',
			descripcion: 'Conviertete en un aventurero que afronta peligros sin saber con certeza lo que vendra, coordinandote con el resto del grupo mientras la historia os empuja hacia riesgos, decisiones y consecuencias compartidas.',
			variant: 'personaje',
		},
	];

	const abrirModalPersonaje = async () => {
		// Si el usuario ya participa en la mision con un personaje, entrar directamente
		try {
			const myUserId = user?.id ?? null;

			if (!myUserId) {
				setIsCharacterModalOpen(true);
				return;
			}

			const resp = await fetch(`${API_URL}/api/misiones/${misionIdNumero}/participantes/jugadores`, {
				headers: authHeaders(),
			});

			if (!resp.ok) {
				setIsCharacterModalOpen(true);
				return;
			}

			const jugadores = await resp.json();
			const yo = Array.isArray(jugadores) ? jugadores.find(j => Number(j.usuarioId) === Number(myUserId)) : null;

			if (yo && yo.personajeId) {
				const personajeObj = {
					id: yo.personajeId,
					nombre: yo.nombrePersonaje,
					nivel: yo.nivel,
					avatar: yo.avatar,
					clase: yo.clase || 'Desconocida',
					puntosGolpeActual: yo.saludActual || 10,
					puntosGolpeMax: yo.saludMax || 10,
					usuario_id: myUserId,
					usuarioId: myUserId,
					nombreUsuario: yo.nombreUsuario,
					color: yo.color || '#4a90d9',
				};

				navigate('/tablero-story-mode', {
					state: {
						modoHistoria,
						mision,
						personaje: personajeObj,
						jugadores: jugadores,
						jugadorActual: personajeObj,
					},
				});
				return;
			}
		} catch (e) {
			// Si algo falla, abrimos el modal de seleccion como fallback
			setIsCharacterModalOpen(true);
			return;
		}

		// No hay participacion previa: abrir modal
		setIsCharacterModalOpen(true);
	};

	const cerrarModalPersonaje = () => {
		setIsCharacterModalOpen(false);
	};

	const irAMisionSugerida = (misionSugerida) => {
		if (!misionSugerida?.id || !misionSugerida?.modoHistoriaId) return;

		const modoDestino = todosModosHistoria.find(m => m.id === misionSugerida.modoHistoriaId);

		setShowNivelInsuficienteModal(false);
		setIsCharacterModalOpen(false);

		navigate(`/story-mode/${misionSugerida.modoHistoriaId}/${misionSugerida.id}`, {
			state: {
				modoHistoria: modoDestino ?? null,
				mision: {
					id: misionSugerida.id,
					nombre: getMissionName(misionSugerida, `Mision ${misionSugerida.id}`),
					descripcion: misionSugerida.descripcion,
					orden: misionSugerida.orden,
					dificultad: misionSugerida.dificultad,
					xpRecompensa: misionSugerida.xpRecompensa,
					completada: misionSugerida.completada,
				},
			},
		});
	};

	const entrarConPersonaje = async () => {
		if (!personajeSeleccionado) return;
		if (!Number.isFinite(misionIdNumero) || misionIdNumero <= 0) {
			setPersonajesError('La mision no es valida para entrar.');
			return;
		}

		const nivelPersonaje = Number(personajeSeleccionado?.nivel ?? 0);
		const nivelRequeridoCampana = Number(modoHistoria?.nivelMinimo ?? state?.modoHistoria?.nivelMinimo ?? 1);

		if (nivelPersonaje < nivelRequeridoCampana) {
			const modosAccesibles = todosModosHistoria.filter(modo => {
				const nivelModo = Number(modo?.nivelMinimo ?? 0);
				return Number.isFinite(nivelModo) && nivelModo <= nivelPersonaje;
			});

			const misionesCompatibles = modosAccesibles.flatMap(modo =>
				(Array.isArray(modo.misiones) ? modo.misiones : []).map(mision => ({
					id: mision.id,
					nombre: getMissionName(mision, `Mision ${mision.id}`),
					descripcion: mision.descripcion,
					orden: mision.orden,
					dificultad: mision.dificultad,
					xpRecompensa: mision.xpRecompensa,
					completada: mision.completada,
					modoHistoriaId: modo.id,
					modoHistoriaNombre: modo.nombre,
				}))
			);

			setNivelCampanaRequerido(nivelRequeridoCampana);
			setMisionesSugeridas(misionesCompatibles);
			setShowNivelInsuficienteModal(true);
			return;
		}

		setEntrandoConPersonajeCargando(true);
		setPersonajesError(null);

		try {
			const response = await fetch(`${API_URL}/api/misiones/${misionIdNumero}/participantes`, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({
					rol: 'JUGADOR',
					personajeId: personajeSeleccionado.id,
				}),
			});

			// 409 significa que ya estaba registrado; seguimos al tablero igualmente.
			if (!response.ok && response.status !== 409) {
				let mensaje = `No se pudo entrar a la mision (${response.status})`;
				try {
					const payload = await response.json();
					mensaje = payload?.mensaje || payload?.message || mensaje;
				} catch {
					// Ignore parse error and keep fallback message.
				}
				setPersonajesError(mensaje);
				return;
			}

			navigate('/tablero-story-mode', {
				state: {
					modoHistoria,
					mision,
					personaje: (() => {
						const clase = personajeSeleccionado.clase || 'Desconocida';
						const p = {
							...personajeSeleccionado,
							clase: clase,
							puntosGolpeActual: personajeSeleccionado.puntosGolpeActual || personajeSeleccionado.hp || 10,
							puntosGolpeMax: personajeSeleccionado.puntosGolpeMax || personajeSeleccionado.hpMax || 10,
							usuario_id: user?.id,
							usuarioId: user?.id,
							nombreUsuario: user?.nombre,
							color: personajeSeleccionado.color || getColorForClase(clase),
						};
						return p;
					})(),
					jugadores: [],
					jugadorActual: (() => {
						const clase = personajeSeleccionado.clase || 'Desconocida';
						const p = {
							...personajeSeleccionado,
							clase: clase,
							puntosGolpeActual: personajeSeleccionado.puntosGolpeActual || personajeSeleccionado.hp || 10,
							puntosGolpeMax: personajeSeleccionado.puntosGolpeMax || personajeSeleccionado.hpMax || 10,
							usuario_id: user?.id,
							usuarioId: user?.id,
							nombreUsuario: user?.nombre,
							color: personajeSeleccionado.color || getColorForClase(clase),
						};
						return p;
					})(),
				},
			});
		} catch (e) {
			setPersonajesError('No se pudo registrar tu participacion en la mision.');
		} finally {
			setEntrandoConPersonajeCargando(false);
		}
	};

	useEffect(() => {
		if (!isCharacterModalOpen) return;
		if (personajes.length > 0) return;

		const cargarPersonajes = async () => {
			setPersonajesCargando(true);
			setPersonajesError(null);

			try {
				const data = await getPersonajes();
				setPersonajes(Array.isArray(data) ? data : []);
			} catch (e) {
				setPersonajesError('No se pudieron cargar tus personajes.');
			} finally {
				setPersonajesCargando(false);
			}
		};

		cargarPersonajes();
	}, [isCharacterModalOpen, personajes.length]);

	useEffect(() => {
		if (!isCharacterModalOpen) return;
		if (todosModosHistoria.length > 0) return;

		const cargarModos = async () => {
			try {
				const response = await fetch(`${API_URL}/api/modos-historia`, {
					headers: authHeaders(),
				});
				if (!response.ok) return;
				const payload = await response.json();
				if (Array.isArray(payload)) {
					setTodosModosHistoria(payload);
				}
			} catch {
				// silently fail, misionesSugeridas quedará vacío
			}
		};

		cargarModos();
	}, [isCharacterModalOpen, todosModosHistoria.length]);

	return (
		<div className="mision-page">
			<div className="mision-bg" aria-hidden="true">
				<div className="mision-bg-overlay" />
			</div>

			<div className="mision-nav-buttons">
				<BackButton to={modoHistoriaId ? `/story-mode/${modoHistoriaId}` : '/home'} state={modoHistoria ? { modoHistoria } : undefined} />
			</div>

			<div className="mision-layout">
				<section className="mision-contenido" aria-label="Detalle de mision">
					<header className="mision-header">
						<p className="mision-kicker">CAPITULO {numeroCapitulo}</p>
						<h1 className="mision-titulo">{tituloMision}</h1>
					</header>

					{cargando ? (
						<div className="mision-cuerpo-placeholder mision-estado">Cargando datos de la mision...</div>
					) : error ? (
						<div className="mision-cuerpo-placeholder mision-estado mision-estado-error">{error}</div>
					) : (
						<div className="mision-detalle-grid">
							<article className="mision-relato">
								<h2 className="mision-seccion-titulo">{narrativa.tituloNarrativo}</h2>
							{narrativa.sinopsis.map((parrafo, indice) => (
								<p key={`sinopsis-${indice}`} className="mision-sinopsis-parrafo">{parrafo}</p>
							))}

							<div className="mision-video-wrap" aria-label="Video de presentacion de la mision">
								<div className="mision-video-placeholder">
									<span className="mision-video-icon">▶</span>
									<p>Espacio para video de presentacion de la mision</p>
								</div>
							</div>

							<div className="mision-modos-grid" aria-label="Modos de juego de la mision">
								{modosJuego.map(modo => (
									<section key={modo.titulo} className={`mision-modo-card mision-modo-card-${modo.variant}`}>
										<h3>{modo.titulo}</h3>
										<p>{modo.descripcion}</p>
										<button
											type="button"
											className="mision-modo-btn"
											onClick={modo.variant === 'personaje' ? abrirModalPersonaje : undefined}
										>
											{modo.variant === 'master' ? 'Master' : 'Personaje'}
										</button>
									</section>
								))}
							</div>
							</article>

							<aside className="mision-panel" aria-label="Informacion complementaria de mision">
							<div className="mision-chip-grid">
								<div
									className="mision-chip mision-chip-dificultad"
									style={{ borderColor: getDificultadColor(mision?.dificultad), color: getDificultadColor(mision?.dificultad) }}
								>
									{mision?.dificultad ?? '-'}
								</div>
								<div className={`mision-chip mision-chip-estado ${mision?.completada ? 'is-completada' : 'is-pendiente'}`}>
									{mision?.completada ? 'Completada' : 'Pendiente'}
								</div>
							</div>

							<section className="mision-bloque">
								<h3>Objetivos de capitulo</h3>
								<ul>
									{narrativa.objetivos.map((objetivo, indice) => (
										<li key={`objetivo-${indice}`}>{objetivo}</li>
									))}
								</ul>
							</section>

							<section className="mision-bloque">
								<h3>Pistas de exploracion</h3>
								<ul>
									{narrativa.pistas.map((pista, indice) => (
										<li key={`pista-${indice}`}>{pista}</li>
									))}
								</ul>
							</section>

							<section className="mision-bloque mision-recompensa">
								<h3>Recompensa narrativa</h3>
								<p>{narrativa.recompensaNarrativa}</p>
							</section>
							</aside>
						</div>
					)}
				</section>

				{capitulos.length > 0 && (
					<aside className="mision-capitulos-lateral" aria-label="Selector de capitulos">
						{capitulos.map(capitulo => (
							<button
								type="button"
								key={capitulo.id}
								className={`mision-capitulo-btn ${capitulo.id === misionIdNumero ? 'is-active' : ''}`}
								onClick={() => irACapitulo(capitulo)}
							>
								CAPITULO {capitulo.orden ?? '-'}
							</button>
						))}
					</aside>
				)}
			</div>

			<CharacterSelectModal
				isOpen={isCharacterModalOpen}
				title="Selecciona a tu personaje"
				personajes={personajes}
				loading={personajesCargando}
				error={personajesError}
				selected={personajeSeleccionado}
				onSelect={setPersonajeSeleccionado}
				onClose={cerrarModalPersonaje}
				onConfirm={entrarConPersonaje}
				confirmLabel="Entrar"
				stats={statsPersonajeSeleccionado}
				getCardImage={personaje => resolveAvatarUrl(personaje.avatar)}
				getPreviewImage={personaje => resolveAvatarPreviewUrl(personaje.avatar)}
				emptyMessage="No tienes personajes disponibles."
				previewEmptyMessage="Selecciona un personaje para ver su avatar"
			/>

			{showNivelInsuficienteModal && (
				<div className="mission-level-gate-overlay" role="dialog" aria-modal="true" aria-label="Nivel insuficiente">
					<div className="mission-level-gate-box">
						<h2 className="mission-level-gate-title">¡Vaya!</h2>

						<div className="mission-level-gate-image">
							<img src="/images/icons/rolo_triste.png" alt="Rolo triste" />
						</div>

						<div className="mission-level-gate-content">
							<p>
								Tu personaje todavía no está listo para esta aventura, tiene un nivel demasiado bajo. Necesitarás llegar al nivel {nivelCampanaRequerido} ganando XP en misiones como:
							</p>

							<ul className="mission-level-gate-list">
								{misionesSugeridas.length > 0 ? (
									misionesSugeridas.map((misionSugerida, index) => (
										<li key={`${misionSugerida.id}-${index}`}>
											<button
												type="button"
												className="mission-level-gate-link"
												onClick={() => irAMisionSugerida(misionSugerida)}
											>
												{`${misionSugerida.modoHistoriaNombre ?? modoHistoria?.nombre ?? 'Modo Historia'} - ${getMissionName(misionSugerida, 'Mision')}`}
											</button>
										</li>
									))
								) : (
									<li>No hay misiones recomendadas para tu nivel actual.</li>
								)}
							</ul>

							<div className="mission-level-gate-actions">
								<button
									type="button"
									className="mission-level-gate-btn"
									onClick={() => setShowNivelInsuficienteModal(false)}
								>
									Volver
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

		</div>
	);
}

export default Mission;
