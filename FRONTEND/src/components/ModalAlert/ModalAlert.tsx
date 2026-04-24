import React from 'react';
import './ModalAlert.css';

interface ModalAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showImage?: boolean;
}

export function ModalAlert({
  isOpen,
  title = "ATENCIÓN",
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  showImage = true
}: ModalAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-alert-overlay">
      <div className="modal-alert-box">
        <h2 className="modal-alert-title">{title}</h2>
        {showImage && (
          <div className="modal-alert-image">
            <img src="/images/icons/rolo_triste.png" alt="Rolo triste" />
          </div>
        )}
        <div className="modal-alert-content">
          <p>{message}</p>
          <div className="modal-alert-actions">
            {onCancel && <button className="modal-alert-btn cancel" onClick={onCancel}>{cancelText}</button>}
            {onConfirm && <button className="modal-alert-btn confirm" onClick={onConfirm}>{confirmText}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
