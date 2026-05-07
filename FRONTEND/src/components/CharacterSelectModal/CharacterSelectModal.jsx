import './CharacterSelectModal.css';

const defaultCardImage = personaje => personaje?.avatar ?? '/images/avatars/default.png';
const defaultPreviewImage = personaje => personaje?.avatar ?? '/images/avatars/default.png';

export function CharacterSelectModal({
  isOpen,
  title = 'Selecciona a tu personaje',
  personajes = [],
  loading = false,
  error = null,
  selected = null,
  onSelect,
  onClose,
  onConfirm,
  confirmLabel = 'Entrar',
  getCardImage = defaultCardImage,
  getPreviewImage = defaultPreviewImage,
  stats = [],
  emptyMessage = 'No tienes personajes disponibles.',
  previewEmptyMessage = 'Selecciona un personaje para ver su avatar',
}) {
  if (!isOpen) return null;

  const mostrarStats = Array.isArray(stats) && stats.length > 0;

  return (
    <div
      className="mission-character-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="mission-character-modal-card">
        <button type="button" className="mission-character-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <h2 className="mission-character-modal-title">{title}</h2>

        {loading ? (
          <div className="mission-character-modal-state">Cargando personajes...</div>
        ) : error ? (
          <div className="mission-character-modal-state mission-character-modal-state-error">{error}</div>
        ) : personajes.length === 0 ? (
          <div className="mission-character-modal-state">{emptyMessage}</div>
        ) : (
          <div className="mission-character-layout">
            <div className="mission-character-list" aria-label="Lista de personajes">
              <div className="mission-character-grid">
                {personajes.map(personaje => {
                  const isSelected = selected?.id === personaje.id;
                  return (
                    <button
                      type="button"
                      key={personaje.id}
                      className={`mission-character-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => onSelect?.(personaje)}
                    >
                      <div className="mission-character-card-frame">
                        <img
                          src={getCardImage(personaje)}
                          alt={personaje.nombre}
                          className="mission-character-card-img"
                          loading="lazy"
                        />
                      </div>
                      <span className="mission-character-card-name">{personaje.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mission-character-preview" aria-label="Avatar seleccionado">
              {selected ? (
                <>
                  <div className="mission-character-preview-head">
                    <span className="mission-character-preview-head-spacer" aria-hidden="true" />
                    <h3 className="mission-character-preview-name">{selected.nombre}</h3>
                    <span className="mission-character-preview-level">Nivel {selected.nivel ?? '-'}</span>
                  </div>
                  <div className="mission-character-preview-media">
                    <img
                      src={getPreviewImage(selected)}
                      alt={selected.nombre}
                      className="mission-character-preview-img"
                    />
                  </div>
                  {mostrarStats && (
                    <div className="mission-character-stats-grid" aria-label="Estadisticas del personaje">
                      {stats.map(stat => (
                        <div key={stat.key} className="mission-character-stat-item">
                          <span className="mission-character-stat-label">{stat.label}:</span>
                          <span className="mission-character-stat-value">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="mission-character-preview-empty">{previewEmptyMessage}</div>
              )}
            </div>
          </div>
        )}

        <div className="mission-character-enter-wrap">
          <button
            type="button"
            className="mision-modo-btn mission-character-enter-btn"
            onClick={onConfirm}
            disabled={!selected}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

