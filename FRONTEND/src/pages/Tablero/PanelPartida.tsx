import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode, MutableRefObject } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { DiceRoller } from './DiceRoller';
import { getAvatarUrl, getCartaUrl } from '../../utils/imageUtils';
import { Comment, Users, Mic, Skull, Sword } from 'pixelarticons/react'
import { Dices, Smile } from 'lucide-react';
import { PerfilPublicoModal } from '../../components/PerfilPublicoModal/PerfilPublicoModal';
import './PanelPartida.css';

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

const DADOS = [
  { caras: 4,  label: 'd4'  },
  { caras: 6,  label: 'd6'  },
  { caras: 8,  label: 'd8'  },
  { caras: 10, label: 'd10' },
  { caras: 12, label: 'd12' },
  { caras: 20, label: 'd20' },
];

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
    if (CLOUDINARY_BASE_URL) candidates.push(`${CLOUDINARY_BASE_URL}/${normalized}.png`);
  } else {
    candidates.push(getAvatarUrl(normalized));
    candidates.push(getCartaUrl(normalized));
    if (CLOUDINARY_BASE_URL) candidates.push(`${CLOUDINARY_BASE_URL}/${normalized}.png`);
  }
  candidates.push('/images/avatar-login.png');
  return candidates;
};

function AvatarImage({ avatar, nombre }: { avatar?: string | null; nombre: string }) {
  const [indice, setIndice] = useState(0);
  const candidates = buildAvatarCandidates(avatar);
  const src = candidates[indice] ?? null;
  useEffect(() => { setIndice(0); }, [avatar]);
  if (!src) return <div className="pp-jugador-avatar-placeholder">{nombre.charAt(0)}</div>;
  return (
    <img src={src} alt={nombre} className="pp-jugador-avatar"
      onError={() => setIndice(prev => (prev + 1 < candidates.length ? prev + 1 : prev))} />
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
        <img key={i} src={`/images/emotes/${match[1]}.png`} alt={match[1]}
          style={{ width: 64, height: 64, verticalAlign: 'middle', margin: '0 2px' }} />
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
  chatSince?: string | null;
  lanzarDadoCaracteristicaRef?: MutableRefObject<((label: string, mod: number) => void) | null>;
}

export function PanelPartida({
  nombreMaster = 'Tú (Master)',
  colorMaster = '#c0392b',
  panelSuperior,
  jugadores,
  campanaId,
  jugadorActual,
  esMaster = false,
  chatSince,
  lanzarDadoCaracteristicaRef,
}: Props) {

  const [pestana, setPestana]                   = useState<'chat' | 'jugadores' | 'voz'>('chat');
  const [mensajes, setMensajes]                 = useState<MensajeChat[]>([]);
  const [inputChat, setInputChat]               = useState('');
  const [modificador, setModificador]           = useState(0);
  const [conectado, setConectado]               = useState(false);
  const [dadoActivo, setDadoActivo]             = useState<string | null>(null);
  const [resultadoActivo, setResultadoActivo]   = useState<number | null>(null);
  const [mostrarEmotes, setMostrarEmotes]       = useState(false);
  const [mostrarDados, setMostrarDados]         = useState(false);

  const [pestana, setPestana] = useState<'chat' | 'jugadores' | 'voz'>('chat');
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputChat, setInputChat] = useState('');
  const [modificador] = useState(0);
  const [conectado, setConectado] = useState(false);
  const [dadoActivo, setDadoActivo] = useState<string | null>(null);
  const [resultadoActivo, setResultadoActivo] = useState<number | null>(null);
  const [mostrarEmotes, setMostrarEmotes] = useState(false);
  const [mostrarDados, setMostrarDados] = useState(false);

  const [perfilPersonajeId, setPerfilPersonajeId] = useState<number | null>(null);
  const [hpOverrides, setHpOverrides]           = useState<Record<string, number>>({});
  const [pendingLabel, setPendingLabel]         = useState<string | null>(null);
  const [pendingMod, setPendingMod]             = useState<number | null>(null);
  const [micActivo, setMicActivo]               = useState(false);
  const [usuariosVoz, setUsuariosVoz]           = useState<string[]>([]);
  const [jugadoresRed, setJugadoresRed]         = useState<any[]>(jugadores || []);

  const esAnimacionRemota         = useRef(false);
  const jugadoresInicializadosRef = useRef(false);

  const jugadoresInicialesIdsRef  = useRef<Set<string>>(new Set());
  const chatRef                   = useRef<HTMLDivElement>(null);
  const stompRef                  = useRef<Client | null>(null);
  const localStreamRef            = useRef<MediaStream | null>(null);
  const peersRef                  = useRef<Map<string, RTCPeerConnection>>(new Map());
  const lastSentAvatarRef         = useRef<string | null>(null);

  // ── Registrar función de tirada de característica en el ref de Tablero ──

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

  // ── Registrar nuestra función en el ref de Tablero ──

  useEffect(() => {
    if (!lanzarDadoCaracteristicaRef) return;
    lanzarDadoCaracteristicaRef.current = (label: string, mod: number) => {
      const resultadoReal = Math.floor(Math.random() * 20) + 1;
      setPendingLabel(label);
      setPendingMod(mod);
      setDadoActivo('d20');
      setResultadoActivo(0);
      if (stompRef.current?.connected && campanaId) {
        const senderId = jugadorActual?.id?.toString() || 'jugador';
        stompRef.current.publish({
          destination: `/app/campana/${campanaId}/dice-roll`,
          body: JSON.stringify({ dado: 'd20', resultado: resultadoReal, senderId }),
        });
      }
    };
  }, [lanzarDadoCaracteristicaRef, campanaId, jugadorActual]);

  // ── WebSocket principal ──
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setConectado(true);
        jugadoresInicializadosRef.current = false;
        jugadoresInicialesIdsRef.current = new Set();

        if (campanaId) {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const sinceParam = chatSince ? `?since=${encodeURIComponent(chatSince)}` : '';
          fetch(`http://localhost:8080/api/misiones/${campanaId}/chat${sinceParam}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
            .then(r => (r.ok ? r.json() : []))
            .then((items: any[]) => {
              const historial: MensajeChat[] = Array.isArray(items)
                ? items.map((m: any) => ({ ...m, id: m.id || (Date.now().toString() + Math.random()) }))
                : [];
              setMensajes(historial.length > 0 ? historial : [{
                id: '0', autor: 'Sistema', colorAutor: '#8b0000',
                texto: 'La partida ha comenzado. ¡Que empiece la aventura!',
                tipo: 'sistema' as const, timestamp: hora(),
              }]);
            })
            .catch(() => {
              setMensajes([{
                id: '0', autor: 'Sistema', colorAutor: '#8b0000',
                texto: 'La partida ha comenzado. ¡Que empiece la aventura!',
                tipo: 'sistema' as const, timestamp: hora(),
              }]);
            });

          client.subscribe(`/topic/campana/${campanaId}/chat`, (frame) => {
            const msg = JSON.parse(frame.body);
            setMensajes(prev => [...prev, {
              ...msg,
              id: Date.now().toString() + Math.random(),
              timestamp: msg.timestamp || hora(),
            }]);
          });

          // ── Jugadores: solo detección de entradas ──
          client.subscribe(`/topic/campana/${campanaId}/jugadores`, (frame) => {
            const list = JSON.parse(frame.body);
            if (!Array.isArray(list) || list.length === 0) return;

            setJugadoresRed(prev => {
              if (!jugadoresInicializadosRef.current) {
                jugadoresInicializadosRef.current = true;
                jugadoresInicialesIdsRef.current = new Set(
                  list
                    .filter((j: any) => j.id?.toString() !== jugadorActual?.id?.toString())
                    .map((j: any) => j.id?.toString())
                );
                return list;
              }

              const prevIds = new Set(prev.map((j: any) => j.id?.toString()));

              // Solo mensajes de entrada — las salidas las gestiona jugadores-leave
              list.forEach((j: any) => {
                const id = j.id?.toString();
                if (!prevIds.has(id) && !jugadoresInicialesIdsRef.current.has(id)) {
                  setMensajes(msgs => [...msgs, {
                    id: `join-${id}-${Date.now()}`,
                    autor: 'Sistema', colorAutor: '#8b0000',
                    texto: `⚔ ${j.nombre || j.usuarioNombre || 'Un jugador'} ha entrado a la partida`,
                    tipo: 'sistema' as const, timestamp: hora(),
                  }]);
                }
              });

              return list;
            });
          });

          // ── Salidas reales via leave explícito del backend ──
          client.subscribe(`/topic/campana/${campanaId}/jugadores-leave`, (frame) => {
            const { jugadorId, nombre } = JSON.parse(frame.body);
            setMensajes(msgs => [...msgs, {
              id: `leave-${jugadorId}-${Date.now()}`,
              autor: 'Sistema', colorAutor: '#8b0000',
              texto: `[skull] ${nombre} ha abandonado la partida`,
              tipo: 'sistema' as const, timestamp: hora(),
            }]);
            setJugadoresRed(prev =>
              prev.filter((j: any) => j.id?.toString() !== jugadorId?.toString())
            );
          });

          client.subscribe(`/topic/campana/${campanaId}/hp-update`, (frame) => {
            const { jugadorId, hp } = JSON.parse(frame.body);
            setHpOverrides(prev => ({ ...prev, [jugadorId]: hp }));
          });

          client.subscribe(`/topic/campana/${campanaId}/dice-roll`, (frame) => {
            const { dado, resultado, senderId } = JSON.parse(frame.body); // añade resultado
                const miId = jugadorActual?.id?.toString() || 'master';
                if (senderId !== miId) {
                  esAnimacionRemota.current = true;
                  setDadoActivo(null);
                  setTimeout(() => {
                    setDadoActivo(dado);
                    setResultadoActivo(resultado); 
                  }, 50);
                }
              });

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
              body: JSON.stringify({ ...jugadorActual, esMaster }),
            });
          }
        } // fin if (campanaId)

        setMensajes(prev => [...prev, {
          id: 'connected-' + Date.now(), autor: 'Sistema', colorAutor: '#8b0000',
          texto: 'Conectado a la partida en tiempo real.', tipo: 'sistema', timestamp: hora(),
        }]);
      }, // fin onConnect
      onDisconnect: () => {
        setConectado(false);
        setMensajes(prev => [...prev, {
          id: 'disconnected-' + Date.now(), autor: 'Sistema', colorAutor: '#8b0000',
          texto: 'Desconectado del servidor.', tipo: 'sistema', timestamp: hora(),
        }]);
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
      try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      localStreamRef.current = null;
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

  // ── Re-publicar join si cambia el avatar ──
  useEffect(() => {
    if (!stompRef.current?.connected || !campanaId || !jugadorActual) return;
    const avatarActual = jugadorActual?.avatar ?? null;
    if (avatarActual === lastSentAvatarRef.current) return;
    lastSentAvatarRef.current = avatarActual;
    stompRef.current.publish({
      destination: `/app/campana/${campanaId}/join`,
      body: JSON.stringify({ ...jugadorActual, esMaster }),
    });
  }, [campanaId, jugadorActual]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [mensajes]);

  const enviarMensaje = useCallback(() => {
    const texto = inputChat.trim();
    if (!texto || !stompRef.current?.connected || !campanaId) return;
    const autorNombre = jugadorActual?.nombre || nombreMaster;
    const autorColor  = jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster;
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;
    const usuarioId   = jugadorActual?.usuarioId ?? jugadorActual?.usuario_id ?? null;
    stompRef.current.publish({
      destination: `/app/campana/${campanaId}/chat.enviar`,
      body: JSON.stringify({ personajeId, usuarioId, autor: autorNombre, colorAutor: autorColor, texto, tipo: 'mensaje', timestamp: hora() }),
    });
    setInputChat('');
  }, [inputChat, nombreMaster, colorMaster, campanaId, jugadorActual]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
  };

  const lanzarDado = (_caras: number, label: string) => {
    const caras = _caras;
        const resultadoReal = Math.floor(Math.random() * caras) + 1; // ← calcular aquí

        if (stompRef.current?.connected && campanaId) {
          const senderId = jugadorActual?.id?.toString() || 'master';
          stompRef.current.publish({
            destination: `/app/campana/${campanaId}/dice-roll`,
            body: JSON.stringify({ dado: label, resultado: resultadoReal, senderId }), // ← enviar resultado
          });
        }
        setDadoActivo(label);
        setResultadoActivo(resultadoReal); // ← usar el mismo resultado
        setMostrarDados(false);
};

  const handleAnimacionFin = useCallback((resultadoReal: number) => {
    if (dadoActivo === null) return;
    if (esAnimacionRemota.current) {
      esAnimacionRemota.current = false;
      setDadoActivo(null);
      setResultadoActivo(null);
      return;
    }
    const autorNombre = jugadorActual?.nombre || nombreMaster;
    const autorColor  = jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster;
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;
    const usuarioId   = jugadorActual?.usuarioId ?? jugadorActual?.usuario_id ?? null;

    const esTiradaCaracteristica = pendingLabel !== null && pendingMod !== null;
    const modFinal  = esTiradaCaracteristica ? pendingMod!  : modificador;
    const dadoFinal = esTiradaCaracteristica ? `d20 (${pendingLabel})` : dadoActivo;
    const total     = resultadoReal + modFinal;

    const msg: MensajeChat = {
      id: Date.now().toString(), autor: autorNombre, colorAutor: autorColor,
      texto: '', tipo: 'tirada', timestamp: hora(),
      tirada: { dado: dadoFinal, resultado: resultadoReal, modificador: modFinal, total },
    };

    if (stompRef.current?.connected && campanaId) {
      stompRef.current.publish({
        destination: `/app/campana/${campanaId}/chat.enviar`,
        body: JSON.stringify({ ...msg, personajeId, usuarioId }),
      });
    } else {
      setMensajes(prev => [...prev, msg]);
    }

    setPendingLabel(null);
    setPendingMod(null);

    onMovimientoRollResult?.(resultadoReal);
    setDadoActivo(null);
    setResultadoActivo(null);
  }, [dadoActivo, modificador, pendingLabel, pendingMod, nombreMaster, colorMaster, campanaId, jugadorActual, onMovimientoRollResult]);

  const handleAtaqueAnimacionFin = useCallback((imagenesResultado: string[]) => {
    if (!CustomDicePanel || dadoActivo === null) return;
    const dado        = dadoActivo.replace(/^ataque-/, '');
    const autorNombre = jugadorActual?.nombre || nombreMaster;
    const autorColor  = jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster;
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;
    const usuarioId   = jugadorActual?.usuarioId ?? jugadorActual?.usuario_id ?? null;
    const msg: MensajeChat = {
      id: Date.now().toString(), autor: autorNombre, colorAutor: autorColor,
      texto: '', tipo: 'tirada', timestamp: hora(),
      tirada: { dado, resultado: 0, modificador: 0, total: 0, imagenes: imagenesResultado },
    };
    if (stompRef.current?.connected && campanaId) {
      stompRef.current.publish({
        destination: `/app/campana/${campanaId}/chat.enviar`,
        body: JSON.stringify({ ...msg, personajeId, usuarioId }),
      });
    } else {
      setMensajes(prev => [...prev, msg]);
    }
    onAtaqueRollResult?.(imagenesResultado.length);


    setDadoActivo(null);
    setResultadoActivo(null);
  }, [dadoActivo, modificador, pendingLabel, pendingMod, nombreMaster, colorMaster, campanaId, jugadorActual]);

  const cambiarHp = (jugadorId: string, hpActual: number, hpMax: number, delta: number) => {
    const nuevoHp = Math.max(0, Math.min(hpMax, hpActual + delta));
    setHpOverrides(prev => ({ ...prev, [jugadorId]: nuevoHp }));
    if (stompRef.current?.connected && campanaId) {
      stompRef.current.publish({
        destination: `/app/campana/${campanaId}/hp-update`,
        body: JSON.stringify({ jugadorId, hp: nuevoHp }),
      });
    }
  };

  const jugadoresBase = Array.isArray(jugadores) ? jugadores : [];
  const jugadoresBasePorId = new Map(jugadoresBase.map(j => [j?.id?.toString?.(), j]));
  const jugadoresBasePorNombre = new Map<string, any>();
  jugadoresBase.forEach(j => {
    if (j?.nombre) jugadoresBasePorNombre.set(j.nombre, j);
    if (j?.usuarioNombre) jugadoresBasePorNombre.set(j.usuarioNombre, j);
  });

  const jugadoresAMostrar = (jugadoresRed.length > 0 ? jugadoresRed : (jugadores !== undefined ? jugadores : JUGADORES_DEMO))
    .filter((j: any) => {
      if (j.esMaster === true) return false;
      if (!j.hp && !j.hpMax) return false;
      if (esMaster) {
        const miId = jugadorActual?.id?.toString();
        return j.id?.toString() !== miId;
      }
      return true;
    })
    .map((j: any, i: number) => {
      const base = jugadoresBasePorId.get(j.id?.toString?.())
        || jugadoresBasePorNombre.get(j.nombre || j.usuarioNombre);
      return {
        id: j.id?.toString() || i.toString(),
        usuarioId: j.usuarioId ?? j.usuario_id ?? null,
        nombre: j.nombre || j.usuarioNombre || 'Aventurero',
        clase: j.clase || base?.clase || 'Desconocida',
        avatar: j.avatar || j.foto || base?.avatar
          || (jugadorActual?.id?.toString?.() === j.id?.toString?.() ? jugadorActual?.avatar : null)
          || (jugadorActual?.nombre && (jugadorActual.nombre === j.nombre || jugadorActual.nombre === j.usuarioNombre)
            ? jugadorActual?.avatar : null)
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
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
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
    <div className="pp-panel">

      <DiceRoller dado={dadoActivo} resultado={resultadoActivo} onAnimacionFin={handleAnimacionFin} />

      <DiceRoller
        dado={dadoActivo}
        resultado={resultadoActivo}
        onAnimacionFin={handleAnimacionFin}
        containerId="dice-box-chat"
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
                          {msg.tirada.imagenes.map((cara, i) => (
                            <img key={i} src={`/images/dadosModHistoria/${cara}.png`} alt={cara}
                              className="pp-tirada-cara-img" title={cara} />
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
                {DADOS.map(({ caras, label }) => (
                  <button key={label} className="pp-dado-pick-btn"
                    onClick={() => lanzarDado(caras, label)} disabled={dadoActivo !== null}>
                    <img src={`/images/dadoCampana/${label}.png`} alt={label} className="pp-dado-pick-img" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
            {mostrarEmotes && (
              <div className="pp-emotes-picker">
                {EMOTES.map(e => (
                  <img key={e.id} src={e.src} alt={e.label} title={e.label} className="pp-emote-opcion"
                    onClick={() => { setInputChat(prev => prev + `[${e.id}]`); setMostrarEmotes(false); }} />
                ))}
              </div>
            )}
            <div className="pp-chat-input-row">
              <button className="pp-emote-btn"
                onClick={() => { setMostrarEmotes(!mostrarEmotes); setMostrarDados(false); }}
                title="Emotes"><Smile /></button>
              <button className={`pp-emote-btn ${mostrarDados ? 'active' : ''}`}
                onClick={() => { setMostrarDados(!mostrarDados); setMostrarEmotes(false); }}
                title="Dados"><Dices width={16} height={16} /></button>
              <textarea
                className="pp-chat-input"
                placeholder={conectado ? 'Escribe un mensaje...' : 'Sin conexión al servidor...'}
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={!conectado}
              />
              <button className="pp-chat-send" onClick={enviarMensaje} disabled={!conectado}>➤</button>
            </div>
          </div>
        </div>
      )}

      {/* ── JUGADORES ── */}
      {pestana === 'jugadores' && (
        <div className="pp-seccion">
          <div className="pp-jugadores-lista">
            <div className="pp-jugador">
              <div className="pp-jugador-cabecera">
                <span className="pp-jugador-dot" style={{ background: colorMaster }} />
                <div className="pp-jugador-avatar-placeholder">M</div>
                <span className="pp-jugador-nombre">{nombreMaster}</span>
                <span className="pp-jugador-clase">Master</span>
              </div>
            </div>

            {jugadoresAMostrar.length > 0 ? (
              jugadoresAMostrar.map(j => {
                const hpReal = hpOverrides[j.id] ?? j.hp;
                return (
                  <div key={j.id} className={`pp-jugador ${j.conectado ? '' : 'desconectado'}`}>
                    <div className="pp-jugador-cabecera">
                      <span className="pp-jugador-dot" style={{ background: j.conectado ? j.color : '#555' }} />
                      <AvatarImage avatar={j.avatar} nombre={j.nombre} />
                      <span className="pp-jugador-nombre" style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          const pid = parseInt(j.id);
                          const miId = jugadorActual?.personajeId ?? jugadorActual?.id;
                          if (!isNaN(pid) && String(pid) !== String(miId)) setPerfilPersonajeId(pid);
                        }}>
                        {j.nombre}
                      </span>
                      <span className="pp-jugador-clase">{j.clase}</span>
                      {!j.conectado && <span className="pp-jugador-off">desconectado</span>}
                    </div>
                    <div className="pp-jugador-hp-wrap">
                      <span className="pp-jugador-hp-label">HP</span>
                      {esMaster && (
                        <button className="pp-hp-btn" onClick={() => cambiarHp(j.id, hpReal, j.hpMax, -1)}>−</button>
                      )}
                      <div className="pp-jugador-hp-barra">
                        <div className="pp-jugador-hp-fill" style={{
                          width: `${(hpReal / j.hpMax) * 100}%`,
                          background: hpReal / j.hpMax > 0.5 ? '#2ecc71' : hpReal / j.hpMax > 0.25 ? '#f39c12' : '#e74c3c',
                        }} />
                      </div>
                      {esMaster && (
                        <button className="pp-hp-btn" onClick={() => cambiarHp(j.id, hpReal, j.hpMax, 1)}>+</button>
                      )}
                      <span className="pp-jugador-hp-num">{hpReal}/{j.hpMax}</span>
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
              <p className="pp-dados-hint" style={{ marginTop: 12 }}>Nadie más en el canal de voz</p>
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

      {perfilPersonajeId !== null && (
        <PerfilPublicoModal personajeId={perfilPersonajeId} onClose={() => setPerfilPersonajeId(null)} />
      )}
    </div>
  );
}