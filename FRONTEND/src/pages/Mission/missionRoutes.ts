export const buildMissionListPath = (modoHistoriaId: string | number) => `/story-mode/${modoHistoriaId}/mission`;

export const buildMissionDetailsPath = (modoHistoriaId: string | number, misionId: string | number) =>
	`/story-mode/${modoHistoriaId}/mission/${misionId}/details`;