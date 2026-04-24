import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../../components/BackButton/BackButton';
import { API_URL, authHeaders } from '../../services/api';
import { obtenerNarrativaMision } from './misionNarrativa';
import './Mision.css';

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

export function Mision() {
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

	const misionIdNumero = useMemo(() => Number(misionId), [misionId]);

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
	const tituloMision = mision?.nombre ?? state?.mision?.nombre ?? `Mision ${misionId ?? '-'}`;
	const narrativa = useMemo(() => obtenerNarrativaMision(mision ?? state?.mision ?? {}), [mision, state]);

	const capitulos = useMemo(() => {
		if (Array.isArray(misionesModoHistoria) && misionesModoHistoria.length > 0) {
			return misionesModoHistoria
				.map((item, index) => ({
					id: Number(item.id),
					orden: item.orden ?? index + 1,
					nombre: item.nombre,
					descripcion: item.descripcion,
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

	return (
		<div className="mision-page">
			<div className="mision-bg" aria-hidden="true">
				<div className="mision-bg-overlay" />
			</div>

			<BackButton to={modoHistoriaId ? `/story-mode/${modoHistoriaId}` : '/home'} state={modoHistoria ? { modoHistoria } : undefined} />

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
										<button type="button" className="mision-modo-btn">
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
		</div>
	);
}
