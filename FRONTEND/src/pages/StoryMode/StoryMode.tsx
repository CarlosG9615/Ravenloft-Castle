import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../../components/BackButton/BackButton';
import { API_URL, authHeaders } from '../../services/api';
import { getModoHistoriaImageCandidates } from '../../utils/imageUtils';
import './StoryMode.css';

interface Mision {
	id: number;
	nombre: string;
	descripcion?: string;
	dificultad?: string;
	orden?: number;
	xpRecompensa?: number;
	completada?: boolean;
	imagen?: string;
	portada?: string;
	modoHistoriaId?: number;
}

interface ModoHistoriaState {
	id: number;
	nombre: string;
	descripcion?: string;
	dificultad?: string;
	nivelMinimo?: number;
	misiones?: Array<{
		id: number;
		nombre?: string;
		descripcion?: string;
		orden?: number;
		dificultad?: string;
		xpRecompensa?: number;
		completada?: boolean;
	}>;
}

interface LocationState {
	modoHistoria?: ModoHistoriaState;
}

const DIFICULTAD_COLOR: Record<string, string> = {
	'Fácil': '#2ecc71',
	'Media': '#f39c12',
	'Difícil': '#e74c3c',
	'Épica': '#9b59b6',
};

const MISIONES_POR_PAGINA = 3;

const getDificultadColor = (dificultad?: string): string => {
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

const normalizarDificultad = (texto: string): string => {
	return texto
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();
};

const normalizarTexto = (texto: string): string => {
	return texto
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();
};

const normalizarMisionesRespuesta = (payload: unknown): Mision[] => {
	if (Array.isArray(payload)) {
		return payload as Mision[];
	}

	if (!payload || typeof payload !== 'object') {
		return [];
	}

	const data = payload as Record<string, unknown>;

	if (Array.isArray(data.misiones)) {
		return data.misiones as Mision[];
	}

	if (typeof data.id === 'number' && typeof data.nombre === 'string') {
		return [data as unknown as Mision];
	}

	return [];
};

export function StoryMode() {
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const [misiones, setMisiones] = useState<Mision[]>([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filtro, setFiltro] = useState<string>('todas');
	const [busqueda, setBusqueda] = useState('');
	const [paginaActual, setPaginaActual] = useState(1);

	const modoId = Number(id);
	const locationState = location.state as LocationState | null;
	const modoHistoria = locationState?.modoHistoria;
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
				
				// Extraer misiones del objeto ModoHistoria
				const modoHistoria = payload as Record<string, unknown>;
				const resultado = Array.isArray(modoHistoria.misiones) 
					? (modoHistoria.misiones as Mision[])
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
					<img
						src={portadaModoHistoria}
						alt=""
						className="sm-bg-image"
						loading="eager"
					/>
				)}
				<div className="sm-bg-overlay" />
			</div>

			<BackButton to="/join" />

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
						<button className="sm-back-btn" onClick={() => navigate('/join')}>Volver a Join</button>
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
										onClick={() => navigate(`/story-mode/${mision.modoHistoriaId ?? modoId}/${mision.id}`, {
											state: {
												mision,
												modoHistoria,
											},
										})}
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
												<span className="jg-card-modo-personajes sm-mision-meta-dificultad" style={{ borderColor: getDificultadColor(dificultad) }}>
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
