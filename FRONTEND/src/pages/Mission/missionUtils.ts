type MissionLike = {
	nombre?: string;
	titulo?: string;
	nombreMision?: string;
	misionNombre?: string;
	name?: string;
	title?: string;
};

const DIFICULTAD_COLOR: Record<string, string> = {
	'Fácil': '#2ecc71',
	'Media': '#f39c12',
	'Difícil': '#e74c3c',
	'Épica': '#9b59b6',
};

export const getMissionName = (mision: MissionLike | null | undefined, fallback = 'Mision'): string => {
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

export const getDificultadColor = (dificultad?: string): string => {
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

export const normalizarDificultad = (texto: string): string => {
	return texto
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();
};

export const normalizarTexto = (texto: string): string => {
	return texto
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();
};