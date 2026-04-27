const NARRATIVA_ESPECIAL_POR_ID = {
	1: {
		tituloNarrativo: 'La primera grieta en el velo',
		escenas: [
			{
				titulo: 'Umbral del castillo',
				texto: 'El aire es mas frio junto a las murallas y el eco devuelve palabras que no has dicho. El entorno se siente atento, como si evaluara si mereces seguir adelante.',
			},
			{
				titulo: 'Sala de velas negras',
				texto: 'La luz titila sin viento. Aqui la mision exige precision: una accion impulsiva puede cerrar caminos, mientras que una mirada paciente revela simbolos ocultos.',
			},
		],
		objetivos: [
			'Reconocer la amenaza principal sin alertar a todos los guardianes.',
			'Reunir evidencia suficiente para preparar la siguiente incurson.',
			'Completar la salida sin romper el sigilo de la zona.',
		],
		pistas: [
			'Cuando un objeto parece decorativo en Ravenloft, casi nunca lo es.',
			'Las rutas seguras suelen tener menos recompensa inmediata, pero abren opciones para la siguiente fase.',
		],
		recompensaNarrativa: 'Superar este tramo no solo otorga experiencia: te concede legitimidad ante tus aliados y desbloquea informacion clave para interpretar las senales del castillo.',
	},
};

const normalizar = (texto) => (texto ?? '')
	.normalize('NFD')
	.replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.trim();

const detectarTemaPorTitulo = (titulo) => {
	const base = normalizar(titulo);

	if (base.includes('ciudad') || base.includes('calle') || base.includes('barrio') || base.includes('plaza')) return 'ciudad';
	if (base.includes('castillo') || base.includes('fortaleza') || base.includes('torre')) return 'castillo';
	if (base.includes('bosque') || base.includes('selva') || base.includes('arboleda')) return 'bosque';
	if (base.includes('ruina') || base.includes('resto') || base.includes('cripta')) return 'ruinas';
	if (base.includes('mazmorra') || base.includes('subterr') || base.includes('catacumba')) return 'mazmorra';
	if (base.includes('niebla') || base.includes('tormenta') || base.includes('clima')) return 'clima';
	if (base.includes('ritual') || base.includes('culto') || base.includes('sangre')) return 'ritual';
	if (base.includes('senal') || base.includes('eco') || base.includes('susurro') || base.includes('sombra')) return 'misterio';

	return 'general';
};

const PLANTILLAS_SINOPSIS_POR_TEMA = {
	ciudad: [
		'Bajo la rutina aparente del distrito se mueve una red de decisiones ocultas: cada contacto, cada desvio y cada demora puede abrir una ventaja tactica o encender un conflicto mayor antes de que el grupo este listo.',
		'El entorno urbano parece estable, pero el equilibrio es fragil; la expedicion debe interpretar rumores, patrones de movimiento y silencios oportunos para adelantarse a una amenaza que prefiere no mostrarse de frente.',
		'Lo que empieza como un recorrido controlado por calles conocidas termina revelando alianzas cambiantes y puntos de presion que pueden convertir una investigacion discreta en una carrera contra el tiempo.',
	],
	castillo: [
		'Nuestros intrépidos aventureros ya están listos para su primer reto, el primer desafío en el castillo Ravenloft ya está aqui. Esperemos que sean capaces de trabajar en equipo y superar los obstáculos que el enemigo les tiene preparados....',
		'Tras los muros antiguos, la amenaza opera con disciplina y memoria; para avanzar, la expedicion necesita leer el terreno como un sistema vivo donde una accion imprudente puede cerrar rutas clave.',
		'Cada sala contiene rastros de una historia inconclusa y de una voluntad que sigue activa, de modo que el exito depende tanto de la fuerza como de detectar que piezas del lugar no encajan con lo esperado.',
	],
	bosque: [
		'Entre senderos inestables y referencias engañosas, la prioridad pasa por mantener orientacion y ritmo, porque el verdadero riesgo no es perder un combate, sino perder la iniciativa antes del siguiente encuentro.',
		'La espesura impone un juego de paciencia: pistas sutiles, rutas que cambian y decisiones de corto alcance que, acumuladas, determinan si la expedicion llega con recursos o totalmente expuesta.',
		'El terreno natural amplifica cualquier error de lectura; avanzar exige alternar prudencia y determinacion para que la exploracion no se convierta en desgaste continuo.',
	],
	ruinas: [
		'Las estructuras derruidas conservan informacion fragmentada que solo cobra sentido cuando se conectan detalles menores, y ese proceso define si el grupo descubre una salida limpia o activa una consecuencia latente.',
		'Cada vestigio del lugar plantea una eleccion entre saqueo rapido y analisis cuidadoso; el progreso real aparece cuando la expedicion interpreta el pasado del enclave como una advertencia operativa.',
		'Bajo la piedra rota persiste una logica antigua que no perdona improvisaciones, por lo que la mision recompensa la observacion fina tanto como la capacidad de reaccionar bajo presion.',
	],
	mazmorra: [
		'El espacio cerrado reduce margenes de error y fuerza decisiones inmediatas; la expedicion debe coordinar recursos, vision y cobertura para evitar que el propio entorno dicte el resultado del episodio.',
		'En pasillos estrechos y camaras hostiles, cada avance se paga con tension acumulada, y la diferencia entre sobrevivir y dominar la situacion depende del orden tactico del grupo.',
		'La ruta interior castiga la prisa y premia la lectura meticulosa de trampas, ritmos y puntos de ruptura, convirtiendo cada tramo en una prueba de control colectivo.',
	],
	clima: [
		'Las condiciones del entorno alteran visibilidad, desplazamiento y toma de decisiones, asi que la expedicion debe adaptar su plan sobre la marcha para sostener el control sin desperdiciar impulso.',
		'El clima no actua como fondo, sino como antagonista tactico: cambia prioridades, desordena formaciones y obliga a elegir entre seguridad inmediata y objetivos de largo alcance.',
		'Con el terreno volviendose imprevisible, el reto consiste en mantener cohesion mientras la amenaza aprovecha cada ventana de confusion para ganar posicion.',
	],
	ritual: [
		'Una operacion cuidadosamente encubierta sostiene el conflicto desde la sombra, y la mision exige identificar sus nodos criticos para cortar su avance antes de que el coste estrategico sea irreversible.',
		'Las pistas apuntan a un plan en ejecucion que depende de tiempos exactos; el grupo debe intervenir con precision para romper la cadena sin exponerse a una respuesta inmediata.',
		'Detras de lo evidente hay un proceso en marcha con objetivos claros y protecciones discretas, por lo que el exito pasa por descubrir quien lo coordina y donde es vulnerable.',
	],
	misterio: [
		'Las señales dispersas no son ruido: forman un patron que solo aparece cuando la expedicion compara indicios y toma decisiones coherentes, transformando intuiciones aisladas en una lectura fiable del peligro.',
		'El episodio se apoya en detalles ambiguos y reacciones tardias del entorno, de modo que la clave no es avanzar mas rapido, sino interpretar correctamente aquello que parece no tener explicacion inmediata.',
		'Cada hallazgo sugiere una verdad parcial; la mision progresa cuando el grupo une esas piezas y detecta que elementos estan puestos para desviar la atencion de lo realmente importante.',
	],
	general: [
		'Nuestros aventureros ya han salido del centro de instrucción y se lanzan a su primera misión de camino al castillo Ravenloft. Por el camino se topan con un campamento la mar de curioso que deberán investigar...',
		'El avance no depende de un unico enfrentamiento, sino de encadenar buenas lecturas del entorno con acciones consistentes para llegar al cierre en una posicion favorable.',
		'El tramo combina exploracion y presion narrativa en dosis crecientes, de forma que la expedicion debe construir ventaja paso a paso en lugar de confiar en una resolucion improvisada.',
	],
};

const obtenerIndicePorTitulo = (titulo, totalOpciones) => {
	const base = normalizar(titulo);
	if (!base || totalOpciones <= 1) return 0;

	let hash = 0;
	for (let i = 0; i < base.length; i += 1) {
		hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
	}

	return hash % totalOpciones;
};

const construirSinopsis = (mision) => {
	const nombre = mision?.nombre ?? '';
	const tema = detectarTemaPorTitulo(nombre);
	const opciones = PLANTILLAS_SINOPSIS_POR_TEMA[tema] ?? PLANTILLAS_SINOPSIS_POR_TEMA.general;
	const indice = obtenerIndicePorTitulo(nombre, opciones.length);

	return [opciones[indice]];
};

const construirNarrativaBase = (mision) => {
	const nombre = mision?.nombre ?? `Mision ${mision?.id ?? '-'}`;
	const descripcion = mision?.descripcion ?? 'No hay resumen oficial para este tramo, por lo que la historia se interpreta a partir de los rastros del entorno.';
	const xp = mision?.xpRecompensa ?? 0;

	return {
		tituloNarrativo: `Sinopsis`,
		sinopsis: construirSinopsis(mision),
		escenas: [
			{
				titulo: 'Apertura de escena',
				texto: descripcion,
			},
			{
				titulo: 'Pulso de conflicto',
				texto: 'El ritmo del tramo se ajusta a la exigencia de la mision y obliga a medir cada accion con precision.',
			},
			{
				titulo: 'Huella del episodio',
				texto: `La mision deja una marca clara sobre ${nombre}: lo sucedido no termina en la escena final, sino que condiciona la forma en que se interpretan los siguientes tramos.`,
			},
		],
		objetivos: [
			'Completar la ruta principal sin perder cohesion de la expedicion.',
			'Identificar al menos una ventaja estrategica para la siguiente fase.',
			'Cerrar el episodio con decisiones que maximicen supervivencia y progreso.',
		],
		pistas: [
			'La primera linea del resumen suele ocultar la clave que define la amenaza real.',
			'Si una via parece demasiado directa, suele ocultar un costo en recursos o tiempo.',
			'Las recompensas mas valiosas aparecen cuando combinas exploracion y prudencia.',
		],
		recompensaNarrativa: `Al completar esta mision sumas ${xp} XP.`,
	};
};

const fusionarNarrativa = (base, especial = {}) => ({
	...base,
	...especial,
	sinopsis: especial.sinopsis ?? base.sinopsis,
	escenas: especial.escenas ?? base.escenas,
	objetivos: especial.objetivos ?? base.objetivos,
	pistas: especial.pistas ?? base.pistas,
});

export const obtenerNarrativaMision = (mision) => {
	const base = construirNarrativaBase(mision);
	const especial = NARRATIVA_ESPECIAL_POR_ID[mision?.id] ?? {};
	return fusionarNarrativa(base, especial);
};
