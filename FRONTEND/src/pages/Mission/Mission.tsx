import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../../components/BackButton/BackButton';
import { CharacterSelectModal } from '../../components/CharacterSelectModal/CharacterSelectModal';
import { ModalAlert } from '../../components/ModalAlert/ModalAlert';
import { API_URL, authHeaders } from '../../services/api';
import { getPersonajes } from '../../services/personajeService';
import { getModoHistoriaImageCandidates } from '../../utils/imageUtils';
import { getAvatarUrl, getCartaUrl } from '../../utils/imageUtils';
import { obtenerNarrativaMision } from './missionNarrative';
import { buildCreateMissionPath, buildMissionDetailsPath, buildMissionListPath } from './missionRoutes';
import { getDificultadColor, getMissionName, normalizarDificultad, normalizarTexto } from './missionUtils';
import './Mission.css';

type MissionStateItem = {
	id: number;
	nombre?: string;
	descripcion?: string;
	dificultad?: string;
	orden?: number;
	xpRecompensa?: number;
	completada?: boolean;
	misionNombre?: string;
	nombreMision?: string;
	titulo?: string;
	name?: string;
	title?: string;
	modoHistoriaId?: number;
};

type ModoHistoriaState = {
	id: number;
	nombre: string;
	descripcion?: string;
	dificultad?: string;
	nivelMinimo?: number;
	jugadoresActuales?: number;
	plazasJugadorLibres?: number;
	misiones?: MissionStateItem[];
};

type MissionLocationState = {
	modoHistoria?: ModoHistoriaState;
	mision?: MissionStateItem;
};

	type CharacterLike = {
	id: number;
	nombre: string;
	avatar?: string;
	nivel?: number;
	statsFinales?: Record<string, number | undefined>;
	statsBase?: Record<string, number | undefined>;
	[key: string]: unknown;
};

type MisionDetalle = {
	id?: number;
	nombre?: string;
	descripcion?: string;
	dificultad?: string;
	orden?: number;
	xpRecompensa?: number;
	completada?: boolean;
};

type MisionParticipanteResponse = {
	id: number;
	misionId: number;
	usuarioId: number;
	usuarioNombre?: string;
	rol?: string;
	personajeId?: number | null;
	personajeNombre?: string | null;
};

type MissionListItem = MisionDetalle & {
	id: number;
	imagen?: string;
	portada?: string;
	modoHistoriaId?: number;
};

const MISIONES_POR_PAGINA = 3;

const isAbsoluteUrl = (value?: string) => /^https?:\/\//i.test(value ?? '');
const isDataUrl = (value?: string) => /^data:/i.test(value ?? '');
const isAppPath = (value?: string) => value?.startsWith?.('/') ?? false;

const resolveAvatarUrl = (avatar?: string) => {
	if (!avatar) return '/images/avatars/default.png';
	if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
	return getCartaUrl(avatar);
};

const resolveAvatarPreviewUrl = (avatar?: string) => {
	if (!avatar) return '/images/avatars/default.png';
	if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
	return getAvatarUrl(avatar);
};

const STAT_LABELS: Record<string, string> = {
	fuerza: 'Fuerza',
	destreza: 'Destreza',
	constitucion: 'Constitución',
	inteligencia: 'Inteligencia',
	sabiduria: 'Sabiduría',
	carisma: 'Carisma',
};

const STAT_KEYS = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'] as const;

const getStatValue = (personaje: CharacterLike | null, statKey: string): number | '-' => {
	if (!personaje) return '-';

	const desdeFinales = personaje.statsFinales?.[statKey];
	if (typeof desdeFinales === 'number') return desdeFinales;

	const desdeBase = personaje.statsBase?.[statKey];
	if (typeof desdeBase === 'number') return desdeBase;

	const plano = personaje[statKey];
	if (typeof plano === 'number') return plano;

	return '-';
};

function MissionListView() {
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const [misiones, setMisiones] = useState<MissionListItem[]>([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filtro, setFiltro] = useState<string>('todas');
	const [busqueda, setBusqueda] = useState('');
	const [paginaActual, setPaginaActual] = useState(1);

	const rutaOrigen = sessionStorage.getItem('storyModeOrigin') || '/join';
	const modoId = Number(id);
	const state = (location.state ?? {}) as MissionLocationState;
	const modoHistoria = state.modoHistoria ?? null;
	const tituloModoHistoria = modoHistoria?.nombre ?? 'Modo Historia';
	const descripcionModoHistoria = modoHistoria?.descripcion ?? 'Misiones del modo historia seleccionado.';
	const portadaModoHistoria = useMemo(() => {
		const titulo = modoHistoria?.nombre?.trim();
		if (!titulo) return undefined;

		const candidates = getModoHistoriaImageCandidates(titulo);
		return candidates[0];
	}, [modoHistoria?.nombre]);

	const misionesDesdeEstado = useMemo(() => {
		if (!modoHistoria?.misiones) return [];

		return modoHistoria.misiones.map(mision => ({
			id: mision.id,
			nombre: mision.nombre ?? `Mision ${mision.id}`,
			descripcion: mision.descripcion,
			orden: mision.orden,
			dificultad: mision.dificultad,
			xpRecompensa: mision.xpRecompensa,
			completada: mision.completada,
			modoHistoriaId: modoHistoria.id,
		}));
	}, [modoHistoria]);

	const misionesFiltradas = useMemo(() => {
		const termino = normalizarTexto(busqueda);

		return misiones.filter(mision => {
			const nombre = normalizarTexto(mision.nombre ?? '');
			const descripcion = normalizarTexto(mision.descripcion ?? '');
			const dificultad = mision.dificultad ?? 'Media';

			const coincideBusqueda =
				termino.length === 0 ||
				nombre.includes(termino) ||
				descripcion.includes(termino) ||
				normalizarTexto(dificultad).includes(termino);

			const coincideFiltro =
				filtro === 'todas' ||
				normalizarDificultad(dificultad) === normalizarDificultad(filtro);

			return coincideBusqueda && coincideFiltro;
		});
	}, [busqueda, filtro, misiones]);

	const totalPaginas = Math.max(1, Math.ceil(misionesFiltradas.length / MISIONES_POR_PAGINA));

	const misionesPaginadas = useMemo(() => {
		const inicio = (paginaActual - 1) * MISIONES_POR_PAGINA;
		return misionesFiltradas.slice(inicio, inicio + MISIONES_POR_PAGINA);
	}, [misionesFiltradas, paginaActual]);

	useEffect(() => {
		setPaginaActual(1);
	}, [busqueda, filtro]);

	useEffect(() => {
		if (paginaActual > totalPaginas) {
			setPaginaActual(totalPaginas);
		}
	}, [paginaActual, totalPaginas]);

	useEffect(() => {
		if (!Number.isFinite(modoId) || modoId <= 0) {
			setError('El id del modo historia no es valido.');
			setCargando(false);
			return;
		}

		const controller = new AbortController();

		const cargarMisiones = async () => {
			setCargando(true);
			setError(null);

			try {
				const response = await fetch(`${API_URL}/api/modos-historia/${modoId}`, {
					signal: controller.signal,
					headers: authHeaders(),
				});

				if (!response.ok) {
					throw new Error(`No se pudieron cargar las misiones (${response.status})`);
				}

				const payload = (await response.json()) as unknown;
				const modoHistoriaResponse = payload as Record<string, unknown>;
				const resultado = Array.isArray(modoHistoriaResponse.misiones)
					? (modoHistoriaResponse.misiones as MissionListItem[])
					: [];

				const idsEstado = new Set(misionesDesdeEstado.map(mision => mision.id));
				const resultadoFiltrado = idsEstado.size > 0
					? resultado.filter(mision => idsEstado.has(mision.id))
					: resultado;

				if (resultadoFiltrado.length > 0) {
					setMisiones(resultadoFiltrado);
				} else if (resultado.length > 0) {
					setMisiones(resultado);
				} else {
					setMisiones(misionesDesdeEstado);
				}
			} catch (e) {
				if (controller.signal.aborted) return;

				if (misionesDesdeEstado.length > 0) {
					setMisiones(misionesDesdeEstado);
					setError(null);
					return;
				}

				setError(e instanceof Error ? e.message : 'Error cargando misiones del modo historia');
			} finally {
				if (!controller.signal.aborted) {
					setCargando(false);
				}
			}
		};

		cargarMisiones();

		return () => controller.abort();
	}, [misionesDesdeEstado, modoId]);

	const irPaginaAnterior = () => {
		setPaginaActual(actual => Math.max(1, actual - 1));
	};

	const irPaginaSiguiente = () => {
		setPaginaActual(actual => Math.min(totalPaginas, actual + 1));
	};

	const puedeIrAtras = paginaActual > 1;
	const puedeIrAdelante = paginaActual < totalPaginas;

	return (
		<div className="sm-page jg-page">
			<div className="sm-bg" aria-hidden="true">
				{portadaModoHistoria && (
					<img src={portadaModoHistoria} alt="" className="sm-bg-image" loading="eager" />
				)}
				<div className="sm-bg-overlay" />
			</div>

			<BackButton to={rutaOrigen} />

			<div className="sm-contenido jg-contenido">
				<div className="jg-header sm-header">
					<h1 className="jg-titulo">{tituloModoHistoria}</h1>
					<h2 className="jg-subtitulo">MODO HISTORIA</h2>
					<p className="jg-descripcion">{descripcionModoHistoria}</p>
				</div>

				<div className="jg-controles sm-controles">
					<div className="jg-busqueda-wrap">
						<span className="jg-busqueda-icon">🔍</span>
						<input
							className="jg-busqueda"
							placeholder="Buscar mision por nombre, descripcion o dificultad..."
							value={busqueda}
							onChange={e => setBusqueda(e.target.value)}
						/>
					</div>

					<div className="jg-filtros">
						{['todas', 'fácil', 'media', 'difícil', 'épica'].map(opcion => (
							<button
								key={opcion}
								className={`jg-filtro-btn ${filtro === opcion ? 'active' : ''}`}
								onClick={() => setFiltro(opcion)}
							>
								{opcion.charAt(0).toUpperCase() + opcion.slice(1)}
							</button>
						))}
					</div>
				</div>

				<div className="jg-seccion-titulo-wrap sm-titulo-wrap" aria-label="Misiones">
					<div className="jg-seccion-titulo-top">
						<div className="jg-seccion-titulo">MISIONES</div>
					</div>
					<div className="jg-seccion-titulo-linea" />
				</div>

				{cargando ? (
					<div className="jg-vacio">
						<div className="jg-vacio-icon">📖</div>
						<p>Cargando misiones del modo historia...</p>
					</div>
				) : error ? (
					<div className="jg-vacio">
						<div className="jg-vacio-icon">⚠</div>
						<p>{error}</p>
						<button className="sm-back-btn" onClick={() => navigate('/join')}>
							Volver a Join
						</button>
					</div>
				) : (
					<>
						<div className="jg-grid">
							{misionesPaginadas.map((mision, index) => {
								const dificultad = mision.dificultad ?? 'Media';

								return (
									<button
										type="button"
										key={mision.id}
										className="jg-card jg-card-modo-historia sm-mision-card"
										style={{ animationDelay: `${index * 0.07}s` }}
										onClick={() =>
											navigate(buildMissionDetailsPath(modoId, mision.id), {
												state: {
													mision,
													modoHistoria,
												},
											})
										}
										aria-label={`Abrir mision ${mision.nombre}`}
									>
										<span className="sm-mision-orden-badge" aria-label={`Orden ${mision.orden ?? '-'}`}>
											{mision.orden ?? '-'}
										</span>

										<div className="jg-card-modo-hero sm-mision-hero">
											{mision.portada || mision.imagen ? (
												<img
													src={mision.portada ?? mision.imagen}
													alt={mision.nombre}
													className="jg-card-modo-img"
													loading="lazy"
												/>
											) : (
												<div className="jg-card-modo-plantilla">
													<span className="jg-card-modo-plantilla-texto">Mision</span>
												</div>
											)}

											<div className="jg-card-overlay" />
										</div>

										<div className="jg-card-info">
											<h3 className="jg-card-nombre">{mision.nombre}</h3>
											<p className="jg-card-desc">{mision.descripcion ?? 'Sin descripcion disponible para esta mision.'}</p>

											<div className="jg-card-modo-meta sm-mision-meta-grid">
												<span
													className="jg-card-modo-personajes sm-mision-meta-dificultad"
													style={{ borderColor: getDificultadColor(dificultad) }}
												>
													{dificultad}
												</span>
												<span className="jg-card-modo-nivel">⭐ XP {mision.xpRecompensa ?? 0}</span>
												<span className={`jg-card-modo-personajes ${mision.completada ? 'sm-mision-completada' : 'sm-mision-pendiente'}`}>
													{mision.completada ? 'Completada' : 'Pendiente'}
												</span>
											</div>
										</div>
									</button>
								);
							})}
						</div>

						{misionesFiltradas.length > 0 && (
							<div className="sm-paginacion" aria-label="Paginacion de misiones">
								<button
									type="button"
									className={`sm-paginacion-flecha ${puedeIrAtras ? 'is-active' : 'is-inactive'}`}
									onClick={puedeIrAtras ? irPaginaAnterior : undefined}
									aria-disabled={!puedeIrAtras}
									aria-label="Pagina anterior"
								>
									{'<'}
								</button>

								<span className="sm-paginacion-numero">{paginaActual}</span>

								<button
									type="button"
									className={`sm-paginacion-flecha ${puedeIrAdelante ? 'is-active' : 'is-inactive'}`}
									onClick={puedeIrAdelante ? irPaginaSiguiente : undefined}
									aria-disabled={!puedeIrAdelante}
									aria-label="Pagina siguiente"
								>
									{'>'}
								</button>
							</div>
						)}

						{misionesFiltradas.length === 0 && (
							<div className="jg-vacio">
								<div className="jg-vacio-icon">📜</div>
								<p>No se encontraron misiones con ese filtro.</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

function MissionDetailView() {
	const { id: modoHistoriaId, misionId } = useParams<{ id: string; misionId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const state = (location.state ?? {}) as MissionLocationState;
	const modoHistoria = state.modoHistoria ?? null;
	const [mision, setMision] = useState<MisionDetalle | null>(state.mision ?? null);
	const [cargando, setCargando] = useState(!state.mision);
	const [error, setError] = useState<string | null>(null);
	const [misionesModoHistoria, setMisionesModoHistoria] = useState<MisionDetalle[]>(
		Array.isArray(modoHistoria?.misiones) ? modoHistoria.misiones : []
	);
	const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
	const [personajes, setPersonajes] = useState<CharacterLike[]>([]);
	const [personajesCargando, setPersonajesCargando] = useState(false);
	const [personajesError, setPersonajesError] = useState<string | null>(null);
	const [personajeSeleccionado, setPersonajeSeleccionado] = useState<CharacterLike | null>(null);
	const [entrandoAMision, setEntrandoAMision] = useState(false);
	const [errorEntrarMision, setErrorEntrarMision] = useState<string | null>(null);
	const [showNivelInsuficienteModal, setShowNivelInsuficienteModal] = useState(false);
	const [nivelCampanaRequerido, setNivelCampanaRequerido] = useState(1);
	const [misionesSugeridas, setMisionesSugeridas] = useState<MisionDetalle[]>([]);
	const [todosModosHistoria, setTodosModosHistoria] = useState<ModoHistoriaState[]>([]);
	const [personajeAsignado, setPersonajeAsignado] = useState<CharacterLike | null>(null);
	const [masterCheckLoading, setMasterCheckLoading] = useState(false);
	const [showMasterOcupadoModal, setShowMasterOcupadoModal] = useState(false);
	const [showJasSoyMasterModal, setShowJasSoyMasterModal] = useState(false);
	const statsPersonajeSeleccionado = useMemo(
		() => STAT_KEYS.map(statKey => ({
			key: statKey,
			label: STAT_LABELS[statKey],
			value: getStatValue(personajeSeleccionado, statKey),
		})),
		[personajeSeleccionado]
	);

	const misionIdNumero = useMemo(() => Number(misionId), [misionId]);

	useEffect(() => {
		if (!Number.isFinite(misionIdNumero) || misionIdNumero <= 0) return;

		const controller = new AbortController();

		const checkParticipacion = async () => {
			try {
				const response = await fetch(`${API_URL}/api/misiones/${misionIdNumero}/participantes/me`, {
					signal: controller.signal,
					headers: authHeaders(),
				});
				if (!response.ok) return;
				const participante = (await response.json()) as MisionParticipanteResponse;
				if (participante.personajeId) {
					setPersonajeAsignado({ id: participante.personajeId, nombre: participante.personajeNombre ?? `Personaje ${participante.personajeId}` });
				}
			} catch {
				// silently ignore — si falla el check, mostramos el modal normalmente
			}
		};

		checkParticipacion();
		return () => controller.abort();
	}, [misionIdNumero]);

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

				const payload = (await response.json()) as MisionDetalle;
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
		const modoHistoriaIdNumero = Number(modoHistoriaId);

		if (!modoHistoriaId || !Number.isFinite(modoHistoriaIdNumero) || modoHistoriaIdNumero <= 0) {
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

				const payload = (await response.json()) as unknown;
				if (Array.isArray(payload)) {
					setMisionesModoHistoria(payload as MisionDetalle[]);
				}
			} catch {
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
					nivelMinimo: undefined,
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

	const irACapitulo = (capitulo: { id: number; nombre?: string; descripcion?: string; orden?: number; dificultad?: string; xpRecompensa?: number; completada?: boolean; }) => {
		if (!modoHistoriaId || !capitulo?.id || capitulo.id === misionIdNumero) return;

		navigate(buildMissionDetailsPath(modoHistoriaId, capitulo.id), {
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
	] as const;

	const irComoMaster = async () => {
		if (!misionIdNumero || !modoHistoriaId) {
			navigate(buildCreateMissionPath(modoHistoriaId!, misionId!), { state: { mision, modoHistoria } });
			return;
		}

		setMasterCheckLoading(true);
		try {
			// 1. Comprobar si el usuario actual ya es master de esta misión
			const meResponse = await fetch(`${API_URL}/api/misiones/${misionIdNumero}/participantes/me`, {
				headers: authHeaders(),
			});
			if (meResponse.ok) {
				const participante = (await meResponse.json()) as MisionParticipanteResponse;
				if (participante.rol === 'MASTER') {
					navigate('/tablero-story-mode', {
						state: { rol: 'master', modoHistoria, mision },
					});
					return;
				}
				// Si existe con otro rol, caemos al flujo normal (CreateMission bloqueará si hay master)
			} else if (meResponse.status === 404) {
				// 2. El usuario no participa — comprobar si hay otro master asignado
				const masterCheckResponse = await fetch(
					`${API_URL}/api/misiones/${misionIdNumero}/participantes/tiene-master`,
					{ headers: authHeaders() }
				);
				if (masterCheckResponse.ok) {
					const data = (await masterCheckResponse.json()) as { tieneMaster: boolean };
					if (data.tieneMaster) {
						setShowMasterOcupadoModal(true);
						return;
					}
				}
			}
		} catch {
			// Si falla el check, procedemos a CreateMission igualmente
		} finally {
			setMasterCheckLoading(false);
		}

		navigate(buildCreateMissionPath(modoHistoriaId!, misionId!), { state: { mision, modoHistoria } });
	};

	const abrirModalPersonaje = async () => {
		if (personajeAsignado) {
			navigate('/tablero-story-mode', {
				state: { modoHistoria, mision, personaje: personajeAsignado },
			});
			return;
		}

		try {
			// Verificar si el usuario actual es master de esta misión
			const meResponse = await fetch(`${API_URL}/api/misiones/${misionIdNumero}/participantes/me`, {
				headers: authHeaders(),
			});
			if (meResponse.ok) {
				const participante = (await meResponse.json()) as MisionParticipanteResponse;
				if (participante.rol === 'MASTER') {
					// El usuario es master, no puede unirse como personaje
					setShowJasSoyMasterModal(true);
					return;
				}
			}
		} catch {
			// Si falla el check, proceder igualmente
		}

		setIsCharacterModalOpen(true);
	};

	const cerrarModalPersonaje = () => {
		setIsCharacterModalOpen(false);
	};

	const irAMisionSugerida = (misionSugerida: MisionDetalle & { modoHistoriaId?: number; modoHistoriaNombre?: string }) => {
		if (!misionSugerida?.id || !misionSugerida?.modoHistoriaId) return;

		const modoDestino = todosModosHistoria.find(m => m.id === misionSugerida.modoHistoriaId);

		setShowNivelInsuficienteModal(false);
		setIsCharacterModalOpen(false);

		navigate(buildMissionDetailsPath(misionSugerida.modoHistoriaId, misionSugerida.id), {
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
		if (!personajeSeleccionado || entrandoAMision) return;

		const nivelPersonaje = Number(personajeSeleccionado?.nivel ?? 0);
		const nivelRequeridoCampana = Number(modoHistoria?.nivelMinimo ?? state?.modoHistoria?.nivelMinimo ?? 1);

		if (nivelPersonaje < nivelRequeridoCampana) {
			const modosAccesibles = todosModosHistoria.filter(modo => {
				const nivelModo = Number(modo?.nivelMinimo ?? 0);
				return Number.isFinite(nivelModo) && nivelModo <= nivelPersonaje;
			});

			const misionesCompatibles = modosAccesibles.flatMap(modo =>
				(Array.isArray(modo.misiones) ? modo.misiones : []).map(misionAccesible => ({
					id: misionAccesible.id,
					nombre: getMissionName(misionAccesible, `Mision ${misionAccesible.id}`),
					descripcion: misionAccesible.descripcion,
					orden: misionAccesible.orden,
					dificultad: misionAccesible.dificultad,
					xpRecompensa: misionAccesible.xpRecompensa,
					completada: misionAccesible.completada,
					modoHistoriaId: modo.id,
					modoHistoriaNombre: modo.nombre,
				}))
			);

			setNivelCampanaRequerido(nivelRequeridoCampana);
			setMisionesSugeridas(misionesCompatibles);
			setShowNivelInsuficienteModal(true);
			return;
		}

		const modoHistoriaIdNumero = Number(modoHistoriaId);
		let plazasJugadorLibres =
			typeof modoHistoria?.plazasJugadorLibres === 'number'
				? Math.max(0, modoHistoria.plazasJugadorLibres)
				: null;

		if (Number.isFinite(modoHistoriaIdNumero) && modoHistoriaIdNumero > 0) {
			try {
				const capacidadResponse = await fetch(`${API_URL}/api/modos-historia/${modoHistoriaIdNumero}`, {
					headers: authHeaders(),
				});
				if (capacidadResponse.ok) {
					const modoActual = (await capacidadResponse.json()) as ModoHistoriaState;
					if (typeof modoActual.plazasJugadorLibres === 'number') {
						plazasJugadorLibres = Math.max(0, modoActual.plazasJugadorLibres);
					} else if (typeof modoActual.jugadoresActuales === 'number') {
						plazasJugadorLibres = Math.max(0, 4 - modoActual.jugadoresActuales);
					}
				}
			} catch {
				// Si falla la validación previa, el backend aplicará la restricción igualmente.
			}
		}

		if (plazasJugadorLibres !== null && plazasJugadorLibres <= 0) {
			setErrorEntrarMision('No quedan plazas libres para rol jugador en esta partida.');
			return;
		}

		setEntrandoAMision(true);
		setErrorEntrarMision(null);

		try {
			const response = await fetch(`${API_URL}/api/misiones/${misionIdNumero}/participantes`, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({ rol: 'JUGADOR', personajeId: personajeSeleccionado.id }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null) as { message?: string } | null;
				setErrorEntrarMision(errorData?.message ?? `No se pudo unirse a la misión (${response.status})`);
				return;
			}
		} catch {
			// Error de red — igual continuamos para no bloquear el flujo
		} finally {
			setEntrandoAMision(false);
		}

		navigate('/tablero-story-mode', {
			state: {
				modoHistoria,
				mision,
				personaje: personajeSeleccionado,
			},
		});
	};

	useEffect(() => {
		if (!isCharacterModalOpen) return;
		if (personajes.length > 0) return;

		const cargarPersonajes = async () => {
			setPersonajesCargando(true);
			setPersonajesError(null);

			try {
				const data = await getPersonajes();
				setPersonajes(Array.isArray(data) ? (data as CharacterLike[]) : []);
			} catch {
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
				const payload = (await response.json()) as unknown;
				if (Array.isArray(payload)) {
					setTodosModosHistoria(payload as ModoHistoriaState[]);
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

			<BackButton to={modoHistoriaId ? buildMissionListPath(modoHistoriaId) : '/home'} state={modoHistoria ? { modoHistoria } : undefined} />

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
								{narrativa.sinopsis.map((parrafo: string, indice: number) => (
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
												disabled={modo.variant === 'master' && masterCheckLoading}
												onClick={
													modo.variant === 'master'
														? irComoMaster
														: abrirModalPersonaje
												}
											>
												{modo.variant === 'master'
													? (masterCheckLoading ? 'Comprobando...' : 'Master')
													: 'Personaje'}
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
										{narrativa.objetivos.map((objetivo: string, indice: number) => (
											<li key={`objetivo-${indice}`}>{objetivo}</li>
										))}
									</ul>
								</section>

								<section className="mision-bloque">
									<h3>Pistas de exploracion</h3>
									<ul>
										{narrativa.pistas.map((pista: string, indice: number) => (
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
				loading={personajesCargando || entrandoAMision}
				error={personajesError ?? errorEntrarMision}
				selected={personajeSeleccionado}
				onSelect={setPersonajeSeleccionado}
				onClose={cerrarModalPersonaje}
				onConfirm={entrarConPersonaje}
				confirmLabel={entrandoAMision ? 'Entrando...' : 'Entrar'}
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
												onClick={() => irAMisionSugerida(misionSugerida as MisionDetalle & { modoHistoriaId?: number; modoHistoriaNombre?: string })}
											>
												{`${(misionSugerida as MisionDetalle & { modoHistoriaNombre?: string }).modoHistoriaNombre ?? modoHistoria?.nombre ?? 'Modo Historia'} - ${getMissionName(misionSugerida, 'Mision')}`}
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

			<ModalAlert
				isOpen={showMasterOcupadoModal}
				title="PARTIDA YA EN CURSO"
				message="Esta misión ya tiene un master asignado. Solo puede haber un master por partida. Si quieres participar, únete como personaje."
				confirmText="Entendido"
				onConfirm={() => setShowMasterOcupadoModal(false)}
				showImage={true}
			/>

			<ModalAlert
				isOpen={showJasSoyMasterModal}
				title="YA ERES MASTER"
				message="Ya estás jugando esta partida como master. Si quieres jugar como personaje, debes acceder como master y abandonar la misión para borrarla."
				confirmText="Entendido"
				onConfirm={() => setShowJasSoyMasterModal(false)}
				showImage={true}
			/>

		</div>
	);
}

export function Mission() {
	const { misionId } = useParams<{ misionId?: string }>();

	return misionId ? <MissionDetailView /> : <MissionListView />;
}

export default Mission;