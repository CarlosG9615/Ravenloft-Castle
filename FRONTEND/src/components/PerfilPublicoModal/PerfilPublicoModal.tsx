import { useState, useEffect } from 'react';
import { getPerfilPorPersonaje, seguirUsuario, dejarDeSeguir } from '../../services/seguimientoService';
import type { PerfilPublicoDTO } from '../../services/seguimientoService';
import './PerfilPublicoModal.css';

interface Props {
  personajeId: number;
  onClose: () => void;
}

export function PerfilPublicoModal({ personajeId, onClose }: Props) {
  const [perfil, setPerfil] = useState<PerfilPublicoDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [siguiendo, setSiguiendo] = useState(false);

  useEffect(() => {
    getPerfilPorPersonaje(personajeId)
      .then(data => {
        setPerfil(data);
        setSiguiendo(data.yoLeSigo);
      })
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, [personajeId]);

  const handleSeguir = async () => {
    if (!perfil) return;
    try {
      if (siguiendo) {
        await dejarDeSeguir(perfil.id);
        setSiguiendo(false);
        setPerfil(prev => prev ? { ...prev, numSeguidores: prev.numSeguidores - 1 } : prev);
      } else {
        await seguirUsuario(perfil.id);
        setSiguiendo(true);
        setPerfil(prev => prev ? { ...prev, numSeguidores: prev.numSeguidores + 1 } : prev);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ppm-overlay" onClick={onClose}>
      <div className="ppm-modal" onClick={e => e.stopPropagation()}>
        <button className="ppm-close" onClick={onClose}>✕</button>

        {cargando ? (
          <div className="ppm-cargando">Cargando perfil...</div>
        ) : perfil ? (
          <div className="ppm-body">
            <div className="ppm-izq">
              <div className="ppm-avatar-wrap">
                {perfil.avatar
                  ? <img src={perfil.avatar} alt={perfil.nombre} className="ppm-avatar" />
                  : <div className="ppm-avatar-placeholder">{perfil.nombre.charAt(0).toUpperCase()}</div>
                }
              </div>
              <div className="ppm-info">
                <div className="ppm-nombre-row">
                  <h3 className="ppm-nombre">{perfil.nombre}</h3>
                  <span className="ppm-rol-badge">{perfil.rol}</span>
                </div>
                <div className="ppm-seguidores-row">
                  <span className="ppm-seg-item"><strong>{perfil.numSeguidores}</strong> seguidores</span>
                  <span className="ppm-seg-sep">·</span>
                  <span className="ppm-seg-item"><strong>{perfil.numSiguiendo}</strong> siguiendo</span>
                </div>
                <button
                  className={`ppm-btn-seguir ${siguiendo ? 'siguiendo' : ''}`}
                  onClick={handleSeguir}
                >
                  {siguiendo ? '✓ Siguiendo' : '+ Seguir'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="ppm-cargando">No se pudo cargar el perfil.</p>
        )}
      </div>
    </div>
  );
}