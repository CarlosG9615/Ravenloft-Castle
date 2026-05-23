import { getAvatarUrl } from '../../../utils/imageUtils';
import { ColorsSwatch } from 'pixelarticons/react';

interface StepAvatarProps {
  raza: string;
  clase: string;
  nombre: string;
  claseApariencia: string;
  avatarsDisponibles: string[];
  avatarSeleccionado: string | null;
  imagenFinal: string | null;
  onSelect: (avatarId: string) => void;
  paso3Valido: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function StepAvatar({
  raza, clase, nombre, claseApariencia, avatarsDisponibles,
  avatarSeleccionado, imagenFinal, onSelect, paso3Valido, onBack, onNext,
}: StepAvatarProps) {
  return (
    <div className="create-card">
      <h4 className="create-section-title mb-2">
        <ColorsSwatch width={20} height={20} style={{ color: 'currentColor' }} /> Apariencia del Personaje
      </h4>
      <p className="create-method-desc mb-4">
        Selecciona un avatar para tu <strong>{raza} {clase}</strong>.
      </p>

      <div className="row g-4 align-items-start">
        <div className="col-lg-8">
          <div className="avatars-grid">
            {avatarsDisponibles.map(avatarId => (
              <button key={avatarId} type="button"
                className={`avatar-option ${avatarSeleccionado === avatarId ? 'active' : ''}`}
                onClick={() => onSelect(avatarId)}
              >
                <img src={getAvatarUrl(avatarId)} alt={avatarId} className="avatar-option-img" loading="lazy" />
              </button>
            ))}
          </div>
          <p className="create-method-desc mt-3 mb-0">
            Solo se muestran avatares de la clase seleccionada: <strong>{claseApariencia}</strong>
          </p>
        </div>

        <div className="col-lg-4">
          <div className="avatar-preview-card">
            <div className="avatar-preview-img-wrap">
              {imagenFinal
                ? <img src={imagenFinal} alt="carta" className="avatar-preview-img" />
                : <div className="avatar-preview-empty">Sin selección</div>
              }
            </div>
            <h3 className="avatar-preview-name mt-3">{nombre}</h3>
            <p className="text-muted text-center small">{raza} · {clase}</p>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button className="btn create-btn-secondary" onClick={onBack}>← Atrás</button>
        <button className="btn create-btn-primary" disabled={!paso3Valido} onClick={onNext}>
          Ver Ficha Final →
        </button>
      </div>
    </div>
  );
}
