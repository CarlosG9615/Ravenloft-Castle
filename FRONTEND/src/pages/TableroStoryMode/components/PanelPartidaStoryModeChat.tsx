import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { DiceRoller } from '../../Tablero/DiceRoller';
import { getAvatarUrl, getCartaUrl } from '../../../utils/imageUtils';
import { Comment, Users, Mic, Skull, Sword } from 'pixelarticons/react'
import { Dices, Smile, Accessibility } from 'lucide-react';
import { PerfilPublicoModal } from '../../../components/PerfilPublicoModal/PerfilPublicoModal';
import { WS_URL } from '../../../services/api';
import { useAccessibility } from '../../../services/AccessibilityContext';
import './PanelPartidaStoryMode.css';

interface Jugador {
  id: string;
  nombre: string;
  clase: string;
  hp: number;
  hpMax: number;
  color: string;
  conectado: boolean;
  avatar?: string | null;
  fuerza?: number;
  destreza?: number;
  constitucion?: number;
  inteligencia?: number;
  sabiduria?: number;
  carisma?: number;
}

interface MensajeChat {
  id: string;
  autor: string;
  colorAutor: string;
  texto: string;
  tipo: 'mensaje' | 'tirada' | 'sistema';
  timestamp: string;
  tirada?: {
    dado: string;
    resultado: number;
    modificador: number;
    total: number;
    imagenes?: string[];
  };
}

// DADOS removed for Story Mode — movement/attack dice handled by StoryModeDicePanel

const EMOTES = [
  { id: 'emoji-sorpre',   src: '/images/emotes/emoji-sorpre.png',   label: 'Sorprendido' },
  { id: 'emoji-molest',   src: '/images/emotes/emoji-molest.png',   label: 'Molesto' },
  { id: 'emoji-furioso',  src: '/images/emotes/emoji-furioso.png',  label: 'Furioso' },
  { id: 'emoji-gracioso', src: '/images/emotes/emoji-gracioso.png', label: 'Gracioso' },
  { id: 'emoji-guino',    src: '/images/emotes/emoji-guino.png',    label: 'Guiño' },
  { id: 'emoji-riendo',   src: '/images/emotes/emoji-riendo.png',   label: 'Riendo' },
  { id: 'emoji-decep',    src: '/images/emotes/emoji-decep.png',    label: 'Decepcionado' },
];

const JUGADORES_DEMO: Jugador[] = [
  { id: '1', nombre: 'Valdris',  clase: 'Bárbaro', hp: 28, hpMax: 35, color: '#4a90d9', conectado: true  },
  { id: '2', nombre: 'Seraphel', clase: 'Clérigo', hp: 18, hpMax: 22, color: '#2ecc71', conectado: true  },
  { id: '3', nombre: 'Kira',     clase: 'Pícaro',  hp: 15, hpMax: 15, color: '#f39c12', conectado: false },
];

const COLORES_CLASES: Record<string, string> = {
  Bárbaro: '#e74c3c', Bardo: '#9b59b6', Clérigo: '#f1c40f',
  Druida: '#2ecc71', Guerrero: '#c0392b', Monje: '#27ae60',
  Paladín: '#f39c12', Explorador: '#16a085', Pícaro: '#34495e',
  Hechicero: '#8e44ad', Brujo: '#2980b9', Mago: '#3498db',
  Desconocida: '#95a5a6'
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const isDataUrl = (value: string) => /^data:/i.test(value);
const isAppPath = (value: string) => value.startsWith('/');

const CLOUDINARY_BASE_URL = import.meta.env.VITE_CLOUDINARY_URL as string | undefined;

const buildAvatarCandidates = (avatar?: string | null) => {
  if (!avatar) return [] as string[];
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return [avatar];

  const normalized = avatar.replace(/\.png$/i, '');
  const candidates: string[] = [];

  if (normalized.startsWith('avatar_') || normalized.startsWith('carta_')) {
    if (CLOUDINARY_BASE_URL) {
      candidates.push(`${CLOUDINARY_BASE_URL}/${normalized}.png`);
    }
  } else {
    candidates.push(getAvatarUrl(normalized));
    candidates.push(getCartaUrl(normalized));
    if (CLOUDINARY_BASE_URL) {
      candidates.push(`${CLOUDINARY_BASE_URL}/${normalized}.png`);
    }
  }

  candidates.push('/images/avatar-login.png');
  return candidates;
};

function AvatarImage({ avatar, nombre }: { avatar?: string | null; nombre: string }) {
  const [indice, setIndice] = useState(0);
  const candidates = buildAvatarCandidates(avatar);
  const src = candidates[indice] ?? null;

  useEffect(() => {
    setIndice(0);
  }, [avatar]);

  if (!src) {
    return <div className="pp-jugador-avatar-placeholder">{nombre.charAt(0)}</div>;
  }

  return (
    <img
      src={src}
      alt={nombre}
      className="pp-jugador-avatar"
      onError={() => setIndice(prev => (prev + 1 < candidates.length ? prev + 1 : prev))}
    />
  );
}

function hora() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function renderTextoConEmotes(texto: string) {
  const partes = texto.split(/(\[emoji-[^\]]+\])/g);
  return partes.map((parte, i) => {
    const match = parte.match(/^\[([^\]]+)\]$/);
    if (match) {
      return (
        <img
          key={i}
          src={`/images/emotes/${match[1]}.png`}
          alt={match[1]}
          style={{ width: 64, height: 64, verticalAlign: 'middle', margin: '0 2px' }}
        />
      );
    }
    return <span key={i}>{parte}</span>;
  });
}

interface Props {
  nombreMaster?: string;
  colorMaster?: string;
  panelSuperior?: ReactNode;
  jugadores?: any[];
  campanaId?: number | string;
  jugadorActual?: any;
  esMaster?: boolean;
  dicesComponent?: React.ComponentType<any>;
  turnoActual?: { turnoActualPersonajeId: string | number | null; fase: 'personajes' | 'master' } | null;
  onMovimientoRollResult?: (resultado: number) => void;
  movimientoYaLanzado?: boolean;
  onAtaqueRollResult?: (cantidadResultados: number) => void;
  ataqueYaLanzado?: boolean;
  playerHpMap?: Record<string, number>;
  onPlayerHpUpdate?: (jugadorId: string, hp: number) => void;
  mensajes?: any[];
  pushLocalChatMessage?: (m: { autor: string; colorAutor?: string; texto: string; tipo?: string; timestamp?: string }) => void;
  sendChatMessage?: (m: { autor: string; colorAutor?: string; texto: string; tipo?: string; tirada?: MensajeChat['tirada'] }) => void;
}

export function PanelPartidaStoryModeChat({
  nombreMaster = 'Tú (Master)',
  colorMaster = '#c0392b',
  panelSuperior,
  jugadores,
  campanaId,
  jugadorActual,
  esMaster = false,
  dicesComponent: CustomDicePanel,
  turnoActual,
  onMovimientoRollResult,
  movimientoYaLanzado = false,
  onAtaqueRollResult,
  ataqueYaLanzado = false,
  playerHpMap,
  onPlayerHpUpdate,
  mensajes = [],
  pushLocalChatMessage,
  sendChatMessage,
}: Props) {
  const [pestana, setPestana] = useState<'chat' | 'jugadores' | 'voz'>('chat');
  const [inputChat, setInputChat] = useState('');
  const modificador = 0;
  const [conectado, setConectado] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(true);
  const { enabled: accessibilityEnabled, toggleAccessibility } = useAccessibility();
  const [dadoActivo, setDadoActivo] = useState<string | null>(null);
  const [resultadoActivo, setResultadoActivo] = useState<number | null>(null);
  const [mostrarEmotes, setMostrarEmotes] = useState(false);
  const [mostrarDados, setMostrarDados] = useState(false);
  const [perfilPersonajeId, setPerfilPersonajeId] = useState<number | null>(null);
  const esAnimacionRemota = useRef(false);
  const jugadoresInicializadosRef = useRef(false);
  const jugadoresInicialesIdsRef = useRef<Set<string>>(new Set());

  const chatRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [micActivo, setMicActivo] = useState(false);
  const [usuariosVoz, setUsuariosVoz] = useState<string[]>([]);
  const [jugadoresRed, setJugadoresRed] = useState<any[]>(jugadores || []);
  const lastSentAvatarRef = useRef<string | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(`${WS_URL}`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConectado(true);
        jugadoresInicializadosRef.current = false;
        jugadoresInicialesIdsRef.current = new Set();
        if (campanaId) {
          // chat history and incoming chat messages are handled centrally by useStoryModeSync
          // PanelPartidaStoryModeChat will receive `mensajes` and `sendChatMessage` via props

          client.subscribe(`/topic/campana/${campanaId}/jugadores`, (frame) => {
            console.log('📣 Recibido broadcast jugadores:', frame.body);
            const list = JSON.parse(frame.body);

            if (!Array.isArray(list) || list.length === 0) return;

            setJugadoresRed(prev => {
              if (!jugadoresInicializadosRef.current) {
                jugadoresInicializadosRef.current = true;
                jugadoresInicialesIdsRef.current = new Set(
                  list
                  .filter((j: any) => j.id?.toString() !== jugadorActual?.id?.toString())
                  .map((j: any) => j.id?.toString()));
                return list;
              }

              const prevIds = new Set(prev.map((j: any) => j.id?.toString()));
              const newIds = new Set(list.map((j: any) => j.id?.toString()));

              list.forEach((j: any) => {
                const id = j.id?.toString();
                if (!prevIds.has(id) && !jugadoresInicialesIdsRef.current.has(id)) {
                  pushLocalChatMessage?.({ autor: 'Sistema', texto: `⚔ ${j.nombre || j.usuarioNombre || 'Un jugador'} ha entrado a la partida`, tipo: 'sistema', colorAutor: '#8b0000' });
                }
              });

              prev.forEach((j: any) => {
                const id = j.id?.toString();
                if (!newIds.has(id)) {
                  pushLocalChatMessage?.({ autor: 'Sistema', texto: `[skull] ${j.nombre || j.usuarioNombre || 'Un jugador'} ha salido de la partida`, tipo: 'sistema', colorAutor: '#8b0000' });
                }
              });

              return list;
            });
          });

          // NOTE: campaign-scoped dice-rolls are deprecated for Story Mode.
          // Story Mode dice must be initiated only by the authorized mission participant
          // and persisted through mission-scoped endpoints. We ignore the old
          // `/topic/campana/{id}/dice-roll` messages here to avoid remote triggers.

          client.subscribe(`/topic/campana/${campanaId}/voice`, async (frame) => {
            const señal = JSON.parse(frame.body);
            const { tipo, de, sdp, candidate } = señal;
            const miId = jugadorActual?.id?.toString() || 'master';
            if (de === miId) return;
            if (tipo === 'offer') {
              const pc = crearPeerConnection(de);
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              stompRef.current?.publish({
                destination: `/app/campana/${campanaId}/voice`,
                body: JSON.stringify({ tipo: 'answer', de: miId, para: de, sdp: answer }),
              });
            } else if (tipo === 'answer') {
              const pc = peersRef.current.get(de);
              if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            } else if (tipo === 'ice-candidate') {
              const pc = peersRef.current.get(de);
              if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          });

          if (jugadorActual) {
            client.publish({
              destination: `/app/campana/${campanaId}/join`,
              body: JSON.stringify(jugadorActual),
            });
          }
        }
        pushLocalChatMessage?.({ autor: 'Sistema', texto: 'Conectado a la partida en tiempo real.', tipo: 'sistema', colorAutor: '#8b0000' });
      },
      onDisconnect: () => {
        setConectado(false);
        pushLocalChatMessage?.({ autor: 'Sistema', texto: 'Desconectado del servidor.', tipo: 'sistema', colorAutor: '#8b0000' });
      },
      onStompError: () => setConectado(false),
    });

    const handleLeave = () => {
      if (client.connected && campanaId && jugadorActual) {
        client.publish({
          destination: `/app/campana/${campanaId}/leave`,
          body: jugadorActual.id.toString(),
        });
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    client.activate();
    stompRef.current = client;

    return () => {
      handleLeave();
      window.removeEventListener('beforeunload', handleLeave);
      try { client.deactivate(); } catch {}
      // Stop local stream
      try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      localStreamRef.current = null;
      // Close peers and cleanup audio nodes
      peersRef.current.forEach((pc, id) => {
        try { pc.close(); } catch {}
        const audio = audioElementsRef.current.get(id);
        if (audio) {
          try { audio.pause(); audio.srcObject = null; audio.remove(); } catch {}
          audioElementsRef.current.delete(id);
        }
      });
      peersRef.current.clear();
      audioElementsRef.current.clear();
    };
  }, [campanaId, jugadorActual]);

  useEffect(() => {
    if (!stompRef.current?.connected || !campanaId || !jugadorActual) return;
    const avatarActual = jugadorActual?.avatar ?? null;
    if (avatarActual === lastSentAvatarRef.current) return;
    lastSentAvatarRef.current = avatarActual;
    stompRef.current.publish({
      destination: `/app/campana/${campanaId}/join`,
      body: JSON.stringify(jugadorActual),
    });
  }, [campanaId, jugadorActual]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  const enviarMensaje = useCallback(() => {
    const texto = inputChat.trim();
    if (!texto || !campanaId) return;
    const usuarioNombre = jugadorActual?.usuarioNombre ?? jugadorActual?.usuario?.nombre ?? jugadorActual?.usuarioName;
    const personajeNombre = jugadorActual?.nombrePersonaje ?? jugadorActual?.nombre ?? jugadorActual?.personajeNombre;
    const autorNombre = esMaster
      ? `${usuarioNombre || nombreMaster} (Master)`
      : (personajeNombre || nombreMaster);
    const autorColor = esMaster ? '#f1c40f' : (jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster);
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;
    const usuarioId = jugadorActual?.usuarioId ?? jugadorActual?.usuario_id ?? null;
    const payload = {
      personajeId,
      usuarioId,
      autor: autorNombre,
      colorAutor: autorColor,
      texto,
      tipo: 'mensaje',
      timestamp: hora(),
    };
    if (sendChatMessage) {
      sendChatMessage({ autor: payload.autor, colorAutor: payload.colorAutor, texto: payload.texto, tipo: payload.tipo });
    } else if (stompRef.current?.connected) {
      stompRef.current.publish({ destination: `/app/campana/${campanaId}/chat.enviar`, body: JSON.stringify(payload) });
    } else {
      pushLocalChatMessage?.({ autor: payload.autor, colorAutor: payload.colorAutor, texto: payload.texto, tipo: payload.tipo, timestamp: payload.timestamp });
    }
    setInputChat('');
  }, [inputChat, nombreMaster, colorMaster, campanaId, jugadorActual]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const lanzarDado = (_caras: number, label: string) => {
    // Only allow the mission participant that represents this client to initiate dice.
    const personajeIdLocal = (jugadorActual?.personajeId ?? jugadorActual?.id)?.toString() ?? null;
    const usuarioIdLocal = (jugadorActual?.usuarioId ?? jugadorActual?.usuario_id ?? jugadorActual?.id)?.toString() ?? null;

    const autorizado = jugadores?.some((p: any) => {
      const pid = (p.personajeId ?? p.id ?? p.usuarioId)?.toString?.() ?? null;
      const uid = (p.usuarioId ?? p.usuario_id ?? p.id)?.toString?.() ?? null;
      return pid === personajeIdLocal || uid === usuarioIdLocal;
    });

    // Allow the mission master to initiate dice regardless of participant mapping
    const puedeIniciar = Boolean(autorizado) || Boolean(esMaster);

    if (!puedeIniciar) {
      pushLocalChatMessage?.({ autor: 'Sistema', texto: 'No estás autorizado para lanzar dados en esta partida.', tipo: 'sistema', colorAutor: '#8b0000' });
      return;
    }

    // Local animation for the initiator; final result is persisted via onMovimientoRollResult/onAtaqueRollResult
    setDadoActivo(label);
    setResultadoActivo(0);
  };

  const handleAnimacionFin = useCallback((resultadoReal: number) => {
    if (dadoActivo === null) return;

    if (esAnimacionRemota.current) {
      esAnimacionRemota.current = false;
      setDadoActivo(null);
      setResultadoActivo(null);
      return;
    }

    const usuarioNombre = jugadorActual?.usuarioNombre ?? jugadorActual?.usuario?.nombre ?? jugadorActual?.usuarioName;
    const personajeNombre = jugadorActual?.nombrePersonaje ?? jugadorActual?.nombre ?? jugadorActual?.personajeNombre;
    const autorNombre = esMaster
      ? `${usuarioNombre || nombreMaster} (Master)`
      : (personajeNombre || nombreMaster);
    const autorColor = esMaster ? '#f1c40f' : (jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster);
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;
    const usuarioId = jugadorActual?.usuarioId ?? jugadorActual?.usuario_id ?? null;
    const total = resultadoReal + modificador;
    const msg: MensajeChat = {
      id: Date.now().toString(),
      autor: autorNombre,
      colorAutor: autorColor,
      texto: '',
      tipo: 'tirada',
      timestamp: hora(),
      tirada: { dado: dadoActivo, resultado: resultadoReal, modificador, total },
    };

    if (sendChatMessage) {
      sendChatMessage({ autor: msg.autor, colorAutor: msg.colorAutor, texto: JSON.stringify(msg.tirada), tipo: 'tirada', tirada: msg.tirada });
    } else if (stompRef.current?.connected && campanaId) {
      stompRef.current.publish({ destination: `/app/campana/${campanaId}/chat.enviar`, body: JSON.stringify({ ...msg, personajeId, usuarioId }) });
    } else {
      pushLocalChatMessage?.(msg);
    }

    onMovimientoRollResult?.(resultadoReal);
    setDadoActivo(null);
    setResultadoActivo(null);
    setMostrarDados(false);
  }, [dadoActivo, modificador, nombreMaster, colorMaster, campanaId, jugadorActual, onMovimientoRollResult]);

  const handleAtaqueAnimacionFin = useCallback((imagenesResultado: string[]) => {
    if (!CustomDicePanel || dadoActivo === null) return;
    const dado = dadoActivo.replace(/^ataque-/, '');
    const usuarioNombre = jugadorActual?.usuarioNombre ?? jugadorActual?.usuario?.nombre ?? jugadorActual?.usuarioName;
    const personajeNombre = jugadorActual?.nombrePersonaje ?? jugadorActual?.nombre ?? jugadorActual?.personajeNombre;
    const autorNombre = esMaster
      ? `${usuarioNombre || nombreMaster} (Master)`
      : (personajeNombre || nombreMaster);
    const autorColor = esMaster ? '#f1c40f' : (jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster);
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;
    const usuarioId = jugadorActual?.usuarioId ?? jugadorActual?.usuario_id ?? null;
    const msg: MensajeChat = {
      id: Date.now().toString(),
      autor: autorNombre,
      colorAutor: autorColor,
      texto: '',
      tipo: 'tirada',
      timestamp: hora(),
      tirada: { dado, resultado: 0, modificador: 0, total: 0, imagenes: imagenesResultado },
    };
    if (sendChatMessage) {
      sendChatMessage({ autor: msg.autor, colorAutor: msg.colorAutor, texto: JSON.stringify(msg.tirada || {}), tipo: 'tirada', tirada: msg.tirada });
    } else if (stompRef.current?.connected && campanaId) {
      stompRef.current.publish({ destination: `/app/campana/${campanaId}/chat.enviar`, body: JSON.stringify({ ...msg, personajeId, usuarioId }) });
    } else {
      pushLocalChatMessage?.(msg);
    }
    onAtaqueRollResult?.(imagenesResultado.length);
    setDadoActivo(null);
    setResultadoActivo(null);
    setMostrarDados(false);
  }, [dadoActivo, nombreMaster, colorMaster, campanaId, jugadorActual, onAtaqueRollResult]);

  const cambiarHp = (jugadorId: string, hpActual: number, hpMax: number, delta: number) => {
    const nuevoHp = Math.max(0, Math.min(hpMax, hpActual + delta));
    onPlayerHpUpdate?.(jugadorId, nuevoHp);
  };

  const jugadoresBase = Array.isArray(jugadores) ? jugadores : [];
  // jugadoresBase[i].id = usuarioId (remapeado en useStoryModeSync)
  const jugadoresBasePorUsuarioId = new Map(jugadoresBase.map(j => [j?.id?.toString?.(), j]));
  // jugadoresBase[i].personajeId viene del spread de ParticipanteJugadorDTO
  const jugadoresBasePorPersonajeId = new Map(jugadoresBase.map(j => [j?.personajeId?.toString?.(), j]));
  const jugadoresBasePorNombre = new Map<string, any>();
  jugadoresBase.forEach(j => {
    if (j?.nombre) jugadoresBasePorNombre.set(j.nombre, j);
    if (j?.usuarioNombre) jugadoresBasePorNombre.set(j.usuarioNombre, j);
  });

  // personajeId canónico del usuario actual: preferir personajeId, caer en id si es objeto personaje
  const miPersonajeId = (jugadorActual?.personajeId ?? jugadorActual?.id)?.toString() ?? null;

  const jugadoresAMostrar = (jugadoresRed.length > 0 ? jugadoresRed : (jugadores !== undefined ? jugadores : JUGADORES_DEMO))
      .filter((j: any) => {

      if (esMaster) {
      const miId = jugadorActual?.id?.toString();
      return j.id?.toString() !== miId;
    }
    return true;
  })

    .map((j: any, i: number) => {
      // jugadoresRed viene del campana WS (JugadorWsDTO): j.id = personajeId, sin personajeId explícito
      // jugadores prop viene de useStoryModeSync (mision WS): j.id = usuarioId, con personajeId
      const base = jugadoresBasePorUsuarioId.get(j.id?.toString?.())
        || jugadoresBasePorPersonajeId.get(j.id?.toString?.())
        || jugadoresBasePorNombre.get(j.nombre || j.usuarioNombre);
      // personajeId: tomar del campo explícito, o del base, o de j.id (que en campana WS ya ES el personajeId)
      const personajeIdResuelto = (j.personajeId ?? base?.personajeId ?? j.id)?.toString() ?? null;
      return {
        id: j.id?.toString() || i.toString(),
        personajeId: personajeIdResuelto,
        usuarioId: (j.usuarioId ?? j.usuario_id ?? base?.usuarioId)?.toString() ?? null,
        nombre: j.nombre || j.usuarioNombre || 'Aventurero',
        clase: j.clase || base?.clase || 'Desconocida',
        avatar: j.avatar
          || j.foto
          || base?.avatar
          || (jugadorActual?.id?.toString?.() === j.id?.toString?.() ? jugadorActual?.avatar : null)
          || (jugadorActual?.nombre && (jugadorActual.nombre === j.nombre || jugadorActual.nombre === j.usuarioNombre)
            ? jugadorActual?.avatar
            : null)
          || null,
        hp: j.hp || base?.hp || 10,
        hpMax: j.hpMax || base?.hpMax || 10,
        color: j.color || base?.color || COLORES_CLASES[j.clase || base?.clase] || '#4a90d9',
        conectado: j.conectado !== false,
        fuerza: j.fuerza ?? base?.fuerza,
        destreza: j.destreza ?? base?.destreza,
        constitucion: j.constitucion ?? base?.constitucion,
        inteligencia: j.inteligencia ?? base?.inteligencia,
        sabiduria: j.sabiduria ?? base?.sabiduria,
        carisma: j.carisma ?? base?.carisma,
      };
    });

  const crearPeerConnection = (peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }
    pc.onicecandidate = (event) => {
      if (event.candidate && stompRef.current?.connected && campanaId) {
        const miId = jugadorActual?.id?.toString() || 'master';
        stompRef.current.publish({
          destination: `/app/campana/${campanaId}/voice`,
          body: JSON.stringify({ tipo: 'ice-candidate', de: miId, candidate: event.candidate }),
        });
      }
    };
    pc.ontrack = (event) => {
      const existing = audioElementsRef.current.get(peerId);
      if (existing) {
        try { existing.pause(); existing.srcObject = null; existing.remove(); } catch {}
        audioElementsRef.current.delete(peerId);
      }
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audio.volume = 1.0;
      audio.setAttribute('data-peer-id', peerId);
      document.body.appendChild(audio);
      audio.play().catch(e => console.error('Error reproduciendo audio:', e));
      audioElementsRef.current.set(peerId, audio);
      setUsuariosVoz(prev => [...new Set([...prev, peerId])]);
    };
    peersRef.current.set(peerId, pc);
    return pc;
  };

  const toggleMic = async () => {
    if (!micActivo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setMicActivo(true);
        const miId = jugadorActual?.id?.toString() || 'master';
        jugadoresAMostrar.forEach(async (j) => {
          if (j.id === miId) return;
          const pc = crearPeerConnection(j.id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          stompRef.current?.publish({
            destination: `/app/campana/${campanaId}/voice`,
            body: JSON.stringify({ tipo: 'offer', de: miId, sdp: offer }),
          });
        });
      } catch (err) {
        console.error('Error accediendo al micrófono:', err);
      }
    } else {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      // Close peers and cleanup audio elements
      peersRef.current.forEach((pc, id) => {
        try { pc.close(); } catch {}
        const audio = audioElementsRef.current.get(id);
        if (audio) {
          try { audio.pause(); audio.srcObject = null; audio.remove(); } catch {}
          audioElementsRef.current.delete(id);
        }
      });
      peersRef.current.clear();
      audioElementsRef.current.clear();
      setMicActivo(false);
      setUsuariosVoz([]);
    }
  };

  return (
    <div className={`pp-panel ${chatAbierto ? '' : 'cerrado'}`}>

      <button className="pp-panel-toggle" onClick={() => setChatAbierto(a => !a)}>
        <span className="pp-panel-toggle-glyph">{chatAbierto ? '>' : '<'}</span>
      </button>

      <DiceRoller
        dado={dadoActivo}
        resultado={resultadoActivo}
        onAnimacionFin={handleAnimacionFin}
      />

      <div className="pp-conexion">
        <span className={`pp-conexion-dot ${conectado ? 'online' : 'offline'}`} />
        <span className="pp-conexion-texto">{conectado ? 'En línea' : 'Sin conexión'}</span>
      </div>

      {panelSuperior && <div className="pp-panel-superior">{panelSuperior}</div>}

      <div className="pp-tabs">
        <button className={`pp-tab ${pestana === 'chat' ? 'active' : ''}`} onClick={() => setPestana('chat')}>
          <Comment width={16} height={16} style={{ marginRight: 4 }} />
        </button>
        <button className={`pp-tab ${pestana === 'jugadores' ? 'active' : ''}`} onClick={() => setPestana('jugadores')}>
          <Users width={16} height={16} style={{ marginRight: 4 }} />
        </button>
        <button className={`pp-tab ${pestana === 'voz' ? 'active' : ''}`} onClick={() => setPestana('voz')}>
          <Mic width={16} height={16} style={{ marginRight: 4 }} />
        </button>
      </div>

      {/* ── CHAT ── */}
      {pestana === 'chat' && (
        <div className="pp-seccion pp-chat-wrap">
          <div className="pp-chat-mensajes" ref={chatRef}>
            {mensajes.map(msg => (
              <div key={msg.id} className={`pp-msg pp-msg--${msg.tipo} ${
                msg.tipo === 'mensaje' && msg.autor !== (jugadorActual?.nombre || nombreMaster) ? 'otros' : ''
              }`}>
                {msg.tipo === 'sistema' && (
                  <span className="pp-msg-sistema">
                    {msg.texto.startsWith('[skull]')
                      ? <><Skull width={16} height={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />{msg.texto.replace('[skull]', '')}</>
                      : <><Sword width={16} height={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />{msg.texto}</>
                    }
                  </span>
                )}
                {msg.tipo === 'mensaje' && (
                  <>
                    <div className="pp-msg-cabecera">
                      <span className="pp-msg-autor" style={{ color: msg.colorAutor }}>{msg.autor}</span>
                      <span className="pp-msg-hora">{msg.timestamp}</span>
                    </div>
                    <p className="pp-msg-texto">{renderTextoConEmotes(msg.texto)}</p>
                  </>
                )}
                {msg.tipo === 'tirada' && msg.tirada && (
                  <>
                    <div className="pp-msg-cabecera">
                      <span className="pp-msg-autor" style={{ color: msg.colorAutor }}>{msg.autor}</span>
                      <span className="pp-msg-hora">{msg.timestamp}</span>
                    </div>
                    {msg.tirada.imagenes ? (
                      <div className="pp-tirada-ataque">
                        <span className="pp-tirada-dado">{msg.tirada.dado}</span>
                        <div className="pp-tirada-caras">
                          {msg.tirada.imagenes.map((cara: string, i: number) => (
                            <img
                              key={i}
                              src={`/images/dadosModHistoria/${cara}.png`}
                              alt={cara}
                              className="pp-tirada-cara-img"
                              title={cara}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pp-tirada-resultado">
                        <span className="pp-tirada-dado">{msg.tirada.dado}</span>
                        <div className="pp-tirada-desglose">
                          <span className="pp-tirada-num">{msg.tirada.resultado}</span>
                          {msg.tirada.modificador !== 0 && (
                            <>
                              <span className="pp-tirada-mod">
                                {msg.tirada.modificador > 0 ? '+' : ''}{msg.tirada.modificador}
                              </span>
                              <span className="pp-tirada-igual">=</span>
                              <span className={`pp-tirada-total ${msg.tirada.total >= 15 ? 'critico' : msg.tirada.total <= 3 ? 'pifia' : ''}`}>
                                {msg.tirada.total}
                              </span>
                            </>
                          )}
                          {msg.tirada.modificador === 0 && (
                            <span className={`pp-tirada-total ${msg.tirada.total >= 18 ? 'critico' : msg.tirada.total <= 2 ? 'pifia' : ''}`}>
                              {msg.tirada.total}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pp-chat-input-wrap">
            {mostrarDados && (
              <div className="pp-dados-picker">
                {/* En Story Mode mostramos sólo el panel específico (movimiento d6/d12 + ataque/defensa) */}
                {CustomDicePanel ? (
                  <CustomDicePanel
                    dadoActivo={dadoActivo}
                    onLanzarDado={lanzarDado}
                    onAtaqueAnimacionFin={handleAtaqueAnimacionFin}
                    turnoActual={turnoActual}
                    jugadorActual={jugadorActual}
                    movimientoYaLanzado={movimientoYaLanzado}
                    ataqueYaLanzado={ataqueYaLanzado}
                  />
                ) : null}
              </div>
            )}
            {mostrarEmotes && (
              <div className="pp-emotes-picker">
                {EMOTES.map(e => (
                  <img
                    key={e.id}
                    src={e.src}
                    alt={e.label}
                    title={e.label}
                    className="pp-emote-opcion"
                    onClick={() => {
                      setInputChat(prev => prev + `[${e.id}]`);
                      setMostrarEmotes(false);
                    }}
                  />
                ))}
              </div>
            )}
            <div className="pp-chat-input-row">
              <button
                className="pp-emote-btn"
                onClick={() => { setMostrarEmotes(!mostrarEmotes); setMostrarDados(false); }}
                title="Emotes"
              ><Smile /></button>
              <button
                className={`pp-emote-btn ${mostrarDados ? 'active' : ''}`}
                onClick={() => { setMostrarDados(!mostrarDados); setMostrarEmotes(false); }}
                title="Dados"
              >
                <Dices width={16} height={16} />
              </button>
              <textarea
                className="pp-chat-input"
                placeholder={conectado ? 'Escribe un mensaje...' : 'Sin conexión al servidor...'}
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={!conectado}
              />
              <div className="pp-chat-actions-col">
                <button
                  className={`pp-accessibility-btn ${accessibilityEnabled ? 'active' : ''}`}
                  title={accessibilityEnabled ? 'Desactivar accesibilidad' : 'Activar accesibilidad'}
                  onClick={toggleAccessibility}
                >
                  <Accessibility size={14} />
                </button>
                <button className="pp-chat-send" onClick={enviarMensaje} disabled={!conectado}>➤</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── JUGADORES ── */}
      {pestana === 'jugadores' && (
        <div className="pp-seccion">
          <div className="pp-jugadores-lista">
            {/* Tarjeta del Master */}
            <div className="pp-jugador pp-jugador--master">
              <div className="pp-jugador-cabecera">
                <span className="pp-jugador-dot" style={{ background: '#f1c40f' }} />
                <span className="pp-master-avatar">M</span>
                <span className="pp-jugador-nombre" style={{ color: '#f1c40f' }}>{nombreMaster}</span>
                <span className="pp-master-badge-tag">Master</span>
              </div>
            </div>

            {jugadoresAMostrar.length > 0 ? (
              jugadoresAMostrar.map(j => {
                const hpReal = playerHpMap?.[j.id] ?? j.hp;
                const sumaAtaque  = (j.fuerza ?? 10) + (j.destreza ?? 10) + (j.constitucion ?? 10);
                const sumaDefensa = (j.inteligencia ?? 10) + (j.sabiduria ?? 10) + (j.carisma ?? 10);
                const dadosAtaque  = sumaAtaque  <= 30 ? 1 : sumaAtaque  <= 50 ? 2 : 3;
                const dadosDefensa = sumaDefensa <= 30 ? 1 : sumaDefensa <= 50 ? 2 : 3;
                return (
                  <div key={j.id} className={`pp-jugador ${j.conectado ? '' : 'desconectado'}`}>
                    <div className="pp-jugador-cabecera">
                      <span className="pp-jugador-dot" style={{ background: j.conectado ? j.color : '#555' }} />
                      <AvatarImage avatar={j.avatar} nombre={j.nombre} />
                      <span
                        className="pp-jugador-nombre"
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          const pid = parseInt(j.id);
                          const miId = jugadorActual?.personajeId ?? jugadorActual?.id;
                          if (!isNaN(pid) && String(pid) !== String(miId)) {
                            setPerfilPersonajeId(pid);
                          }
                        }}
                      >
                        {j.nombre}
                      </span>
                      <span className="pp-jugador-clase">{j.clase}</span>
                      {!j.conectado && <span className="pp-jugador-off">desconectado</span>}
                    </div>
                    <div className="pp-jugador-hp-wrap">
                      <span className="pp-jugador-hp-label">HP</span>
                      {j.personajeId != null && miPersonajeId != null && j.personajeId === miPersonajeId && (
                        <button className="pp-hp-btn" onClick={() => cambiarHp(j.id, hpReal, j.hpMax, -1)}>−</button>
                      )}
                      <div className="pp-jugador-hp-barra">
                        <div
                          className="pp-jugador-hp-fill"
                          style={{
                            width: `${(hpReal / j.hpMax) * 100}%`,
                            background: hpReal / j.hpMax > 0.5 ? '#2ecc71' : hpReal / j.hpMax > 0.25 ? '#f39c12' : '#e74c3c',
                          }}
                        />
                      </div>
                      {j.personajeId != null && miPersonajeId != null && j.personajeId === miPersonajeId && (
                        <button className="pp-hp-btn" onClick={() => cambiarHp(j.id, hpReal, j.hpMax, 1)}>+</button>
                      )}
                      <span className="pp-jugador-hp-num">{hpReal}/{j.hpMax}</span>
                    </div>
                    <div className="pp-jugador-stats">
                      <div className="pp-jugador-stat pp-jugador-stat--ata">
                        <span className="pp-jugador-stat-label">ATA</span>
                        <span className="pp-jugador-stat-valor">{dadosAtaque}</span>
                        <span className="pp-jugador-stat-mod">{dadosAtaque === 1 ? '1 dado' : `${dadosAtaque} dados`}</span>
                      </div>
                      <div className="pp-jugador-stat pp-jugador-stat--def">
                        <span className="pp-jugador-stat-label">DEF</span>
                        <span className="pp-jugador-stat-valor">{dadosDefensa}</span>
                        <span className="pp-jugador-stat-mod">{dadosDefensa === 1 ? '1 dado' : `${dadosDefensa} dados`}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="tb-vacio" style={{ textAlign: 'center', opacity: 0.5, fontSize: '13px', paddingTop: '20px' }}>
                Sin jugadores en la partida
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── VOZ ── */}
      {pestana === 'voz' && (
        <div className="pp-seccion pp-voz-wrap">
          <p className="pp-dados-hint">Canal de voz de la partida</p>
          <button className={`pp-mic-btn ${micActivo ? 'activo' : ''}`} onClick={toggleMic}>
            {micActivo ? '🎙 Micrófono activo' : '  Activar micrófono'}
          </button>
          <div className="pp-voz-usuarios">
            {usuariosVoz.length === 0 ? (
              <p className="pp-dados-hint" style={{ marginTop: 12 }}>
                Nadie más en el canal de voz
              </p>
            ) : (
              usuariosVoz.map(id => (
                <div key={id} className="pp-voz-usuario">
                  <span className="pp-conexion-dot online" />
                  <span>{jugadoresAMostrar.find(j => j.id === id)?.nombre || id}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MODAL PERFIL PÚBLICO ── */}
      {perfilPersonajeId !== null && (
        <PerfilPublicoModal
          personajeId={perfilPersonajeId}
          onClose={() => setPerfilPersonajeId(null)}
        />
      )}
    </div>
  );
}
