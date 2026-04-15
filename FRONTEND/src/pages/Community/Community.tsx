import { useState, useRef } from 'react';
import './Community.css';

// ── TIPOS ─────────────────────────────────────────────────
interface Comentario {
  id: string;
  autor: string;
  avatar: string;
  texto: string;
  timestamp: string;
}

interface Post {
  id: string;
  autor: string;
  avatar: string;
  timestamp: string;
  texto: string;
  imagen?: string;
  likes: number;
  likedByMe: boolean;
  comentarios: Comentario[];
  showComentarios: boolean;
}

// ── DATOS MOCK ────────────────────────────────────────────
const POSTS_INICIALES: Post[] = [
  {
    id: '1',
    autor: 'DungeonLord42',
    avatar: 'D',
    timestamp: 'hace 2 horas',
    texto: '¡Acabo de terminar la campaña "La Maldición del Dragón Esmeralda" con mi grupo! Fue épico, el boss final casi nos mata a todos 😅 ¿Alguien más ha jugado esta campaña?',
    imagen: undefined,
    likes: 24,
    likedByMe: false,
    comentarios: [
      { id: 'c1', autor: 'Elara_Maga', avatar: 'E', texto: '¡Qué envidia! Nosotros llevamos 3 sesiones y aún no llegamos al boss 😂', timestamp: 'hace 1 hora' },
      { id: 'c2', autor: 'Thorin_Escudo', avatar: 'T', texto: 'El dragón tiene una mecánica súper interesante en la fase 2, no os la spoileo', timestamp: 'hace 45 min' },
    ],
    showComentarios: false,
  },
  {
    id: '2',
    autor: 'Seraphel_Clerigo',
    avatar: 'S',
    timestamp: 'hace 5 horas',
    texto: 'Mi personaje acaba de subir al nivel 10 🎉 Después de 6 meses de campaña por fin soy un clérigo de nivel alto. El Master me sorprendió con un item épico como recompensa.',
    imagen: undefined,
    likes: 47,
    likedByMe: true,
    comentarios: [
      { id: 'c3', autor: 'DungeonLord42', avatar: 'D', texto: '¡Felicidades! Nivel 10 ya es territorio peligroso 👑', timestamp: 'hace 4 horas' },
    ],
    showComentarios: false,
  },
  {
    id: '3',
    autor: 'Kira_Picaro',
    avatar: 'K',
    timestamp: 'hace 1 día',
    texto: 'Buscando grupo para campaña de iniciación. Soy nueva en D&D pero tengo muchas ganas de aprender. Horario flexible entre semana por las tardes. ¿Alguien me acoge? 🙏',
    imagen: undefined,
    likes: 31,
    likedByMe: false,
    comentarios: [
      { id: 'c4', autor: 'MasterElfo', avatar: 'M', texto: 'Tengo un grupo de principiantes, te mando mensaje privado', timestamp: 'hace 20 horas' },
      { id: 'c5', autor: 'GuíaRol', avatar: 'G', texto: '¡Bienvenida al mundo del rol! Es adictivo 😄', timestamp: 'hace 18 horas' },
      { id: 'c6', autor: 'Seraphel_Clerigo', avatar: 'S', texto: 'Nosotros también aceptamos un jugador más si te interesa', timestamp: 'hace 15 horas' },
    ],
    showComentarios: false,
  },
  {
    id: '4',
    autor: 'MasterElfo',
    avatar: 'M',
    timestamp: 'hace 2 días',
    texto: 'Consejo de master del día: nunca infravalores el poder de una buena descripción ambiental. Mis jugadores llevan 3 sesiones con pesadillas por cómo describí la entrada a las catacumbas 👻',
    imagen: undefined,
    likes: 89,
    likedByMe: false,
    comentarios: [
      { id: 'c7', autor: 'DungeonLord42', avatar: 'D', texto: 'El worldbuilding es el 50% del juego. Totalmente de acuerdo', timestamp: 'hace 1 día' },
    ],
    showComentarios: false,
  },
];

// ── HELPERS ───────────────────────────────────────────────
const COLORES_AVATAR = [
  '#8b0000', '#1a6b3c', '#1a3a6b', '#6b1a6b',
  '#6b4a1a', '#1a5a6b', '#6b1a3a', '#3a6b1a',
];

function colorAvatar(letra: string) {
  return COLORES_AVATAR[letra.charCodeAt(0) % COLORES_AVATAR.length];
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export function Community() {
  const [posts, setPosts] = useState<Post[]>(POSTS_INICIALES);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState<string | undefined>();
  const [comentarioTexto, setComentarioTexto] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Publicar nuevo post
  const publicarPost = () => {
    if (!nuevoTexto.trim()) return;
    const nuevo: Post = {
      id: Date.now().toString(),
      autor: 'Tú',
      avatar: 'T',
      timestamp: 'ahora',
      texto: nuevoTexto.trim(),
      imagen: nuevaImagen,
      likes: 0,
      likedByMe: false,
      comentarios: [],
      showComentarios: false,
    };
    setPosts(prev => [nuevo, ...prev]);
    setNuevoTexto('');
    setNuevaImagen(undefined);
  };

  // Like
  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  // Toggle comentarios
  const toggleComentarios = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, showComentarios: !p.showComentarios } : p
    ));
  };

  // Añadir comentario
  const añadirComentario = (postId: string) => {
    const texto = comentarioTexto[postId]?.trim();
    if (!texto) return;
    const nuevo: Comentario = {
      id: Date.now().toString(),
      autor: 'Tú',
      avatar: 'T',
      texto,
      timestamp: 'ahora',
    };
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comentarios: [...p.comentarios, nuevo] }
        : p
    ));
    setComentarioTexto(prev => ({ ...prev, [postId]: '' }));
  };

  // Subir imagen
  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNuevaImagen(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="cm-page">
      <div className="cm-bg" />

      <div className="cm-contenido">

        {/* CABECERA */}
        <div className="cm-header">
          <h1 className="cm-titulo">⚔ Comunidad</h1>
          <p className="cm-subtitulo">Comparte tus aventuras con otros aventureros de RavenLoft</p>
        </div>

        {/* CREAR POST */}
        <div className="cm-crear-post">
          <div className="cm-crear-avatar" style={{ background: colorAvatar('T') }}>T</div>
          <div className="cm-crear-cuerpo">
            <textarea
              className="cm-crear-input"
              placeholder="¿Qué aventura quieres compartir hoy?"
              value={nuevoTexto}
              onChange={e => setNuevoTexto(e.target.value)}
              rows={3}
            />
            {nuevaImagen && (
              <div className="cm-preview-img-wrap">
                <img src={nuevaImagen} alt="preview" className="cm-preview-img" />
                <button className="cm-preview-quitar" onClick={() => setNuevaImagen(undefined)}>✕</button>
              </div>
            )}
            <div className="cm-crear-acciones">
              <button className="cm-btn-img" onClick={() => fileRef.current?.click()}>
                🖼 Añadir imagen
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImagen} />
              <button
                className="cm-btn-publicar"
                onClick={publicarPost}
                disabled={!nuevoTexto.trim()}
              >
                Publicar ➤
              </button>
            </div>
          </div>
        </div>

        {/* FEED */}
        <div className="cm-feed">
          {posts.map((post, i) => (
            <div key={post.id} className="cm-post" style={{ animationDelay: `${i * 0.06}s` }}>

              {/* CABECERA POST */}
              <div className="cm-post-header">
                <div className="cm-avatar" style={{ background: colorAvatar(post.avatar) }}>
                  {post.avatar}
                </div>
                <div className="cm-post-meta">
                  <span className="cm-post-autor">{post.autor}</span>
                  <span className="cm-post-tiempo">{post.timestamp}</span>
                </div>
              </div>

              {/* CONTENIDO */}
              <p className="cm-post-texto">{post.texto}</p>
              {post.imagen && (
                <img src={post.imagen} alt="post" className="cm-post-imagen" />
              )}

              {/* ACCIONES */}
              <div className="cm-post-acciones">
                <button
                  className={`cm-accion-btn ${post.likedByMe ? 'liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <span className="cm-accion-icono">{post.likedByMe ? '❤️' : '🤍'}</span>
                  <span className="cm-accion-num">{post.likes}</span>
                </button>

                <button
                  className="cm-accion-btn"
                  onClick={() => toggleComentarios(post.id)}
                >
                  <span className="cm-accion-icono">💬</span>
                  <span className="cm-accion-num">{post.comentarios.length}</span>
                </button>
              </div>

              {/* COMENTARIOS */}
              {post.showComentarios && (
                <div className="cm-comentarios">
                  {post.comentarios.map(c => (
                    <div key={c.id} className="cm-comentario">
                      <div className="cm-comentario-avatar" style={{ background: colorAvatar(c.avatar) }}>
                        {c.avatar}
                      </div>
                      <div className="cm-comentario-cuerpo">
                        <div className="cm-comentario-header">
                          <span className="cm-comentario-autor">{c.autor}</span>
                          <span className="cm-comentario-tiempo">{c.timestamp}</span>
                        </div>
                        <p className="cm-comentario-texto">{c.texto}</p>
                      </div>
                    </div>
                  ))}

                  {/* INPUT COMENTARIO */}
                  <div className="cm-nuevo-comentario">
                    <div className="cm-comentario-avatar" style={{ background: colorAvatar('T') }}>T</div>
                    <div className="cm-nuevo-comentario-input-wrap">
                      <input
                        className="cm-nuevo-comentario-input"
                        placeholder="Escribe un comentario..."
                        value={comentarioTexto[post.id] || ''}
                        onChange={e => setComentarioTexto(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && añadirComentario(post.id)}
                      />
                      <button
                        className="cm-nuevo-comentario-btn"
                        onClick={() => añadirComentario(post.id)}
                      >
                        ➤
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}