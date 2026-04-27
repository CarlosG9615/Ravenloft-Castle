import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateCampaign.css';
import { crearCampana } from '../../services/campanaService';

// ── TIPOS ─────────────────────────────────────────────────
interface Campana {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Mapa {
  id: number;
  nombre: string;
  imagen?: string;
  categoria: string[];
  favorito: boolean;
}

// ── DATOS ─────────────────────────────────────────────────
const MIS_CAMPANAS_MOCK: Campana[] = [];



const CATEGORIAS_MAPA = [
  { key: 'Todos',     icon: '🗺' },
  { key: 'Día',       icon: '☀️' },
  { key: 'Noche',     icon: '🌙' },
  { key: 'Interior',  icon: '🏚' },
  { key: 'Combate',   icon: '⚔️' },
  { key: 'Bosque',    icon: '🌲' },
  { key: 'Ciudad',    icon: '🏙' },
  { key: 'Destruido', icon: '💀' },
  { key: 'Cyberpunk', icon: '⚡' },
  { key: 'Medieval',  icon: '🏰' },
  { key: 'Clima',     icon: '🌧️' },
];

const MAPAS_MOCK: Mapa[] = [
  // BOSQUE
  { id: 1,  nombre: 'Camino Forestal',        imagen: '/images/mapas/bosque/caminoForestal.jpg',        categoria: ['Bosque', 'Día'],               favorito: false },
  { id: 2,  nombre: 'Bosque Claro',           imagen: '/images/mapas/bosque/BosqueClaro.jpg',            categoria: ['Bosque', 'Día'],               favorito: false },
  { id: 3,  nombre: 'Cruce de Caminos',       imagen: '/images/mapas/bosque/cruceDeCaminos.jpg',         categoria: ['Bosque', 'Día'],               favorito: false },
  { id: 4,  nombre: 'Río con Puente',         imagen: '/images/mapas/bosque/rioConPuente.jpg',           categoria: ['Bosque', 'Día'],               favorito: false },
  { id: 5,  nombre: 'Lago Pequeño',           imagen: '/images/mapas/bosque/lagopequeño.jpg',            categoria: ['Bosque', 'Día'],               favorito: false },
  { id: 6,  nombre: 'Montaña',               imagen: '/images/mapas/bosque/montaña.jpg',                categoria: ['Bosque', 'Día'],               favorito: false },
  { id: 7,  nombre: 'Campamento',            imagen: '/images/mapas/bosque/campamentoImprovisado.jpg',  categoria: ['Bosque', 'Noche', 'Combate'],  favorito: false },

  // MAZMORRAS
  { id: 8,  nombre: 'Entrada Cueva',         imagen: '/images/mapas/mazmorras/entradaCueva.jpg',        categoria: ['Interior', 'Noche'],           favorito: false },
  { id: 9,  nombre: 'Cueva Interior',        imagen: '/images/mapas/mazmorras/cuevaInterior.jpg',       categoria: ['Interior', 'Noche', 'Combate'],favorito: false },
  { id: 10, nombre: 'Celdas',               imagen: '/images/mapas/mazmorras/celdas.jpg',               categoria: ['Interior', 'Noche'],           favorito: false },
  { id: 11, nombre: 'Sala del Trono',        imagen: '/images/mapas/mazmorras/salaTrono.jpg',            categoria: ['Interior', 'Combate'],         favorito: false },
  { id: 12, nombre: 'Sala Grande',           imagen: '/images/mapas/mazmorras/salaGrandeVacia.jpg',     categoria: ['Interior', 'Noche'],           favorito: false },
  { id: 13, nombre: 'Emboscada',             imagen: '/images/mapas/mazmorras/emboscada.jpg',            categoria: ['Interior', 'Combate'],         favorito: false },

  // MEDIEVAL
  { id: 14, nombre: 'Taberna Pequeña',       imagen: '/images/mapas/medieval/tabernaPequeña.jpg',       categoria: ['Medieval', 'Interior'],        favorito: false },
  { id: 15, nombre: 'Taberna Grande',        imagen: '/images/mapas/medieval/tabernaGrande.jpg',        categoria: ['Medieval', 'Interior'],        favorito: false },
  { id: 16, nombre: 'Callejón',             imagen: '/images/mapas/medieval/callejon.jpg',              categoria: ['Medieval', 'Noche'],           favorito: false },
  { id: 17, nombre: 'Plaza',                imagen: '/images/mapas/medieval/plaza.jpg',                 categoria: ['Medieval', 'Día'],             favorito: false },
  { id: 18, nombre: 'Mercado',              imagen: '/images/mapas/medieval/mercado.jpg',               categoria: ['Medieval', 'Día'],             favorito: false },
  { id: 19, nombre: 'Casa Humilde',         imagen: '/images/mapas/medieval/casaHumilde.jpg',           categoria: ['Medieval', 'Interior'],        favorito: false },
  { id: 20, nombre: 'Casa Rica',            imagen: '/images/mapas/medieval/casaRica.jpg',              categoria: ['Medieval', 'Interior'],        favorito: false },
  { id: 21, nombre: 'Tienda',              imagen: '/images/mapas/medieval/tienda.jpg',                categoria: ['Medieval', 'Interior'],        favorito: false },
  { id: 22, nombre: 'Playa Medieval',       imagen: '/images/mapas/medieval/playamedieval.jpg',         categoria: ['Medieval', 'Día'],             favorito: false },

  // RUINAS
  { id: 23, nombre: 'Bosque en Ruinas',      imagen: '/images/mapas/ruinas/bosqueEnRuinas.jpg',         categoria: ['Destruido', 'Bosque'],         favorito: false },
  { id: 24, nombre: 'Playa Ciudad Incendio', imagen: '/images/mapas/ruinas/playaCiudadIncendio.jpg',    categoria: ['Destruido', 'Combate'],        favorito: false },
  { id: 25, nombre: 'Centro Comercial Roto', imagen: '/images/mapas/ruinas/centroComercialRuina.jpg',  categoria: ['Destruido', 'Interior'],       favorito: false },
  { id: 26, nombre: 'Catedral en Ruinas',    imagen: '/images/mapas/ruinas/catedralRuinas.jpg',         categoria: ['Destruido', 'Interior'],       favorito: false },
  { id: 27, nombre: 'Sangre',               imagen: '/images/mapas/ruinas/sangre.jpg',                  categoria: ['Destruido', 'Combate'],        favorito: false },
  { id: 28, nombre: 'Habitación Sangre',    imagen: '/images/mapas/ruinas/habitacionSangre.png',        categoria: ['Destruido', 'Interior'],       favorito: false },
  { id: 29, nombre: 'Plaza en Ruina',        imagen: '/images/mapas/ruinas/plazaEnRuina.jpg',            categoria: ['Destruido', 'Combate'],        favorito: false },
  { id: 30, nombre: 'Ciudad Ruina',          imagen: '/images/mapas/ruinas/ciudadRuina.jpg',             categoria: ['Destruido'],                   favorito: false },

  // CIBERPUNK
  { id: 31, nombre: 'Ciudad de Noche',       imagen: '/images/mapas/ciberpunk/ciudadDenoche.jpg',       categoria: ['Cyberpunk', 'Noche', 'Ciudad'],favorito: false },
  { id: 32, nombre: 'Fábrica Misteriosa',   imagen: '/images/mapas/ciberpunk/fabricaMisteriosa.jpg',   categoria: ['Cyberpunk', 'Interior'],       favorito: false },
  { id: 33, nombre: 'Carretera',            imagen: '/images/mapas/ciberpunk/carretra.jpg',             categoria: ['Cyberpunk', 'Día'],            favorito: false },
  { id: 34, nombre: 'Carretera Abandonada', imagen: '/images/mapas/ciberpunk/carretraAbandonada.jpg',   categoria: ['Cyberpunk', 'Destruido'],      favorito: false },
  { id: 35, nombre: 'Lluvia Ciudad Cp',     imagen: '/images/mapas/ciberpunk/lluviaCiudad.jpg',         categoria: ['Cyberpunk', 'Noche', 'Ciudad'],favorito: false },
  { id: 36, nombre: 'Feria Ciudad',         imagen: '/images/mapas/ciberpunk/feriaCiudad.jpg',          categoria: ['Cyberpunk', 'Día'],            favorito: false },
  { id: 37, nombre: 'Playa Cyberpunk',      imagen: '/images/mapas/ciberpunk/playa.jpg',                categoria: ['Cyberpunk', 'Día'],            favorito: false },
  { id: 38, nombre: 'Centro Comercial Cp',  imagen: '/images/mapas/ciberpunk/centroComercial.jpg',      categoria: ['Cyberpunk', 'Interior'],       favorito: false },
  { id: 39, nombre: 'Casa de PJ',          imagen: '/images/mapas/ciberpunk/casadePj.jpg',             categoria: ['Cyberpunk', 'Interior'],       favorito: false },
  { id: 40, nombre: 'Casa Ciudad PJ',      imagen: '/images/mapas/ciberpunk/casaCiudadPj.jpg',         categoria: ['Cyberpunk', 'Interior'],       favorito: false },

  // CLIMA
  { id: 41, nombre: 'Lluvia Lago',          imagen: '/images/mapas/clima/lluviaLago.jpg',               categoria: ['Clima', 'Bosque', 'Noche'],    favorito: false },
  { id: 42, nombre: 'Lluvia Ciudad',        imagen: '/images/mapas/clima/lluviaCiudad.jpg',             categoria: ['Clima', 'Ciudad', 'Noche'],    favorito: false },
  { id: 43, nombre: 'Lluvia',              imagen: '/images/mapas/clima/lluvia.jpg',                   categoria: ['Clima', 'Noche'],              favorito: false },
  { id: 44, nombre: 'Lluvia Noche',         imagen: '/images/mapas/clima/lluviaNoche.jpg',              categoria: ['Clima', 'Noche'],              favorito: false },
  { id: 45, nombre: 'Niebla',              imagen: '/images/mapas/clima/nieba.jpg',                    categoria: ['Clima', 'Bosque', 'Noche'],    favorito: false },
  { id: 46, nombre: 'Nevado',              imagen: '/images/mapas/clima/nevado.jpg',                   categoria: ['Clima', 'Noche'],              favorito: false },
  { id: 47, nombre: 'Carretera Niebla',    imagen: '/images/mapas/clima/carreteraNiebla.jpg',          categoria: ['Clima', 'Noche'],              favorito: false },
  { id: 48, nombre: 'Niebla Bosque',       imagen: '/images/mapas/clima/niebla.jpg',                   categoria: ['Clima', 'Bosque', 'Noche'],    favorito: false },
];

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function CreateCampaign() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<string | null>(null);

  // Mapas
  const [mapas, setMapas] = useState<Mapa[]>(MAPAS_MOCK);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [mapasSeleccionados, setMapasSeleccionados] = useState<number[]>([]);
  const [mapaIndex, setMapaIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleFavorito = (id: number) => {
    setMapas(prev => prev.map(m => m.id === id ? { ...m, favorito: !m.favorito } : m));
  };

  const toggleMapa = (id: number) => {
    setMapasSeleccionados(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id);
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  const mapasFiltrados = categoriaActiva === 'Todos'
    ? mapas
    : mapas.filter(m => m.categoria.includes(categoriaActiva));

  const cambiarMapa = (dir: 1 | -1) => {
    setFadeIn(false);
    setTimeout(() => {
      setMapaIndex(i => {
        const next = i + dir;
        if (next < 0) return mapasFiltrados.length - 1;
        if (next >= mapasFiltrados.length) return 0;
        return next;
      });
      setFadeIn(true);
    }, 200);
  };

  const cambiarCategoria = (cat: string) => {
    setCategoriaActiva(cat);
    setMapaIndex(0);
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 200);
  };

  const mapaRandom = () => {
    const disponibles = mapasFiltrados.filter(m => !mapasSeleccionados.includes(m.id));
    if (disponibles.length === 0 || mapasSeleccionados.length >= 10) return;
    const random = disponibles[Math.floor(Math.random() * disponibles.length)];
    setMapasSeleccionados(prev => [...prev, random.id]);
    const idx = mapasFiltrados.findIndex(m => m.id === random.id);
    if (idx !== -1) {
      setFadeIn(false);
      setTimeout(() => { setMapaIndex(idx); setFadeIn(true); }, 200);
    }
  };

  const mapaActual = mapasFiltrados[mapaIndex] ?? null;

  const handleCrearCampana = async () => {
    try {
      setGuardando(true);
      await crearCampana({
        nombre,
        descripcion,
        logo: logoFile,
        imagen: imagenFile,
        mapasSeleccionados,
      });
      // Optionally, navigate to a success page or back to /join where it shows "Mis Campañas"
      navigate('/join');
    } catch (error) {
      console.error('Error creando campaña', error);
      alert('Hubo un error al crear la campaña. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // ── PASO 1: MIS CAMPAÑAS ──────────────────────────────
  if (paso === 1) {
    return (
      <div className="cc-page--campanas">
        <div className="cc-campanas-contenido">
          <div className="cc-campanas-grid">
            <div className="cc-campana-card cc-campana-card--mis" onClick={() => navigate('/join')}>
              <div className="cc-campana-icono">📋</div>
              <h3 className="cc-campana-label">Mis Campañas</h3>
              <p className="cc-campana-sub">Accede a tus campañas creadas y gestiona las fichas</p>
            </div>
            <div className="cc-campana-card cc-campana-card--add" onClick={() => setPaso(2)}>
              <div className="cc-campana-icono cc-campana-icono--add">+</div>
              <h3 className="cc-campana-label">+ añadir</h3>
              <p className="cc-campana-sub">Crea una nueva campaña y empieza tu aventura</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PASO 2: FORMULARIO ────────────────────────────────
  if (paso === 2) {
    return (
      <div className="cc-page--form">
        <div className="cc-form-contenido">
          <h2 className="cc-form-titulo">Añadir Campaña</h2>
          <div className="cc-form">

            <div className="cc-field">
              <label className="cc-label">Nombre</label>
              <input className="cc-input" placeholder="Nombre de la campaña..."
                value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>

            <div className="cc-field">
              <label className="cc-label">Logo</label>
              <div className="cc-file-wrap">
                <label className="cc-file-btn" htmlFor="logo-input">
                  {logoFile ? '✅ Logo cargado' : 'Seleccionar archivo'}
                </label>
                <input id="logo-input" type="file" accept="image/*" className="cc-file-hidden"
                  onChange={e => handleFile(e, setLogoFile)} />
                {logoFile && <img src={logoFile} alt="logo" className="cc-file-preview" />}
              </div>
            </div>

            <div className="cc-field">
              <label className="cc-label">Imagen</label>
              <div className="cc-file-wrap">
                <label className="cc-file-btn" htmlFor="imagen-input">
                  {imagenFile ? '✅ Imagen cargada' : 'Seleccionar archivo'}
                </label>
                <input id="imagen-input" type="file" accept="image/*" className="cc-file-hidden"
                  onChange={e => handleFile(e, setImagenFile)} />
                {imagenFile && <img src={imagenFile} alt="portada" className="cc-file-preview" />}
              </div>
            </div>

            <div className="cc-field">
              <label className="cc-label">Descripción</label>
              <textarea className="cc-input cc-textarea" placeholder="Describe tu campaña..."
                value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4} />
            </div>

            <button className="cc-btn-next" disabled={!nombre.trim()} onClick={() => setPaso(3)}>→</button>
          </div>
        </div>
      </div>
    );
  }

  // ── PASO 3: MAPAS SOBRE LA MESA ───────────────────────
  return (
    <div className="cc-page--mesa">
        <h2 className="cc-mesa-titulo">Elige tus mapas</h2>

    {/* BOTÓN FILTRO */}
    <button
      className="cc-filtro-btn-icon"
      onClick={() => setFiltroAbierto(!filtroAbierto)}
    >
      <i className="fi fi-rr-settings-sliders" style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }}></i>
    </button>

      {/* PANEL LATERAL */}
      <div className={`cc-filtro-panel ${filtroAbierto ? 'abierto' : ''}`}>
        <div className="cc-filtro-panel-header">
          <span className="cc-filtro-panel-titulo">Filtros</span>
          <button className="cc-filtro-panel-cerrar" onClick={() => setFiltroAbierto(false)}>✕</button>
        </div>
        <div className="cc-filtro-panel-opciones">
          {CATEGORIAS_MAPA.map(cat => (
            <button
              key={cat.key}
              className={`cc-mesa-filtro ${categoriaActiva === cat.key ? 'active' : ''}`}
              onClick={() => { cambiarCategoria(cat.key); setFiltroAbierto(false); }}
            >
              {cat.icon} {cat.key}
            </button>
          ))}
    <button
      className="cc-mesa-filtro cc-mesa-filtro--random"
      onClick={() => { mapaRandom(); setFiltroAbierto(false); }}
      disabled={mapasSeleccionados.length >= 10}
    >
      🎲 Random
    </button>
  </div>
</div>
      
    
      <div className="cc-mesa-zona">
        <button className="cc-mesa-flecha cc-mesa-flecha--izq" onClick={() => cambiarMapa(-1)}
          disabled={mapasFiltrados.length <= 1}>◀</button>

        <div className="cc-mesa-centro">
          {mapaActual ? (
            <div
              className={`cc-mesa-mapa ${fadeIn ? 'visible' : ''} ${mapasSeleccionados.includes(mapaActual.id) ? 'seleccionado' : ''}`}
              onClick={() => toggleMapa(mapaActual.id)}
            >
              {mapaActual.imagen
                ? <img src={mapaActual.imagen} alt={mapaActual.nombre} className="cc-mesa-mapa-img" />
                : (
                  <div className="cc-mesa-mapa-placeholder">
                    <span className="cc-mesa-mapa-icon">🗺</span>
                    <span className="cc-mesa-mapa-nombre-overlay">{mapaActual.nombre}</span>
                  </div>
                )
              }
              {mapasSeleccionados.includes(mapaActual.id) && (
                <div className="cc-mesa-check">✓ Añadido</div>
              )}
              <div className="cc-mesa-mapa-info">
                <span className="cc-mesa-mapa-nombre">{mapaActual.nombre}</span>
                <div className="cc-mesa-mapa-cats">
                  {mapaActual.categoria.map(c => (
                    <span key={c} className="cc-mesa-cat">{c}</span>
                  ))}
                </div>
              </div>
              <button
                className={`cc-mesa-fav ${mapaActual.favorito ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); toggleFavorito(mapaActual.id); }}
              >⭐</button>
            </div>
          ) : (
            <div className="cc-mesa-vacio"><p>No hay mapas en esta categoría</p></div>
          )}
          {mapasFiltrados.length > 0 && (
            <div className="cc-mesa-contador">{mapaIndex + 1} / {mapasFiltrados.length}</div>
          )}
        </div>

        <button className="cc-mesa-flecha cc-mesa-flecha--der" onClick={() => cambiarMapa(1)}
          disabled={mapasFiltrados.length <= 1}>▶</button>
      </div>

      {mapasSeleccionados.length > 0 && (
        <div className="cc-mesa-seleccionados">
          <span className="cc-mesa-sel-count">{mapasSeleccionados.length}/10 mapas</span>
          <div className="cc-mesa-sel-chips">
            {mapasSeleccionados.map(id => {
              const m = mapas.find(m => m.id === id);
              return m ? (
                <span key={id} className="cc-mesa-chip">
                  {m.nombre}
                  <button onClick={() => toggleMapa(id)}>✕</button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      <button
        className="cc-mesa-btn-crear"
        disabled={mapasSeleccionados.length === 0 || guardando}
        onClick={handleCrearCampana}
      >
        {guardando ? 'Creando...' : 'Crear Campaña'}
      </button>
    </div>
  );
}