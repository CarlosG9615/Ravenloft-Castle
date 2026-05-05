import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { DiceRoller } from './DiceRoller';
import { Comment, Users, Mic, MicOff} from 'pixelarticons/react'
import { Dices } from 'lucide-react';

import './PanelPartida.css';

// ── TIPOS ─────────────────────────────────────────────────
interface Jugador {
  id: string;
  nombre: string;
  clase: string;
  hp: number;
  hpMax: number;
  color: string;
  conectado: boolean;
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

const JUGADORES_DEMO: Jugador[] = [
  { id: '1', nombre: 'Valdris',  clase: 'Bárbaro', hp: 28, hpMax: 35, color: '#4a90d9', conectado: true  },
  { id: '2', nombre: 'Seraphel', clase: 'Clérigo', hp: 18, hpMax: 22, color: '#2ecc71', conectado: true  },
  { id: '3', nombre: 'Kira',     clase: 'Pícaro',  hp: 15, hpMax: 15, color: '#f39c12', conectado: false },
];

const COLORES_CLASES: Record<string, string> = {
  Bárbaro: '#e74c3c',
  Bardo: '#9b59b6',
  Clérigo: '#f1c40f',
  Druida: '#2ecc71',
  Guerrero: '#c0392b',
  Monje: '#27ae60',
  Paladín: '#f39c12',
  Explorador: '#16a085',
  Pícaro: '#34495e',
  Hechicero: '#8e44ad',
  Brujo: '#2980b9',
  Mago: '#3498db',
  Desconocida: '#95a5a6'
};

function hora() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function tirarDado(caras: number): number {
  return Math.floor(Math.random() * caras) + 1;
}

// ── COMPONENTE ────────────────────────────────────────────
interface Props {
  nombreMaster?: string;
  colorMaster?: string;
  panelSuperior?: ReactNode;
  jugadores?: any[]; // The real players mapped from backend, if present
  campanaId?: number | string;
  jugadorActual?: any;
}

export function PanelPartida({ nombreMaster = 'Tú (Master)', colorMaster = '#c0392b', panelSuperior, jugadores, campanaId, jugadorActual }: Props) {
  const [pestana, setPestana] = useState<'chat' | 'jugadores' | 'dados' | 'voz'>('chat');
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: '0',
      autor: 'Sistema',
      colorAutor: '#8b0000',
      texto: 'La partida ha comenzado. ¡Que empiece la aventura!',
      tipo: 'sistema',
      timestamp: hora(),
    },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [modificador, setModificador] = useState(0);
  const [conectado, setConectado] = useState(false);
  const [dadoActivo, setDadoActivo] = useState<string | null>(null);
  const [resultadoActivo, setResultadoActivo] = useState<number | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [micActivo, setMicActivo] = useState(false);
  const [usuariosVoz, setUsuariosVoz] = useState<string[]>([]);

  const [jugadoresRed, setJugadoresRed] = useState<any[]>(jugadores || []);

  // ── CONEXIÓN WEBSOCKET ──────────────────────────────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,

      onConnect: () => {
        setConectado(true);

        if (campanaId) {
          client.subscribe(`/topic/campana/${campanaId}/chat`, (frame) => {
      
            const msg = JSON.parse(frame.body);
            setMensajes(prev => [...prev, {
              ...msg,
              id: Date.now().toString() + Math.random(),
              timestamp: msg.timestamp || hora(),
            }]);
          });
          client.subscribe(`/topic/campana/${campanaId}/jugadores`, (frame) => {

            const list = JSON.parse(frame.body);
            setJugadoresRed(list);
          });
          
          // Voz - WebRTC
          client.subscribe(`/topic/campana/${campanaId}/voice`, async (frame) => {
            const señal = JSON.parse(frame.body);
            const { tipo, de, sdp, candidate } = señal;
            const miId = jugadorActual?.id?.toString() || 'master';

            if (de === miId) return; // ignorar mis propios mensajes

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

        setMensajes(prev => [...prev, {
          id: 'connected-' + Date.now(),
          autor: 'Sistema',
          colorAutor: '#8b0000',
          texto: 'Conectado a la partida en tiempo real.',
          tipo: 'sistema',
          timestamp: hora(),
        }]);
      },

      onDisconnect: () => {
        setConectado(false);
        setMensajes(prev => [...prev, {
          id: 'disconnected-' + Date.now(),
          autor: 'Sistema',
          colorAutor: '#8b0000',
          texto: 'Desconectado del servidor.',
          tipo: 'sistema',
          timestamp: hora(),
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
      client.deactivate(); 
    };
  }, [campanaId, jugadorActual]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  // ── ENVIAR MENSAJE ────────────────────────────────────
  const enviarMensaje = useCallback(() => {
    const texto = inputChat.trim();
    if (!texto || !stompRef.current?.connected || !campanaId) return;

    const autorNombre = jugadorActual?.nombre || nombreMaster;
    const autorColor = jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster;

    stompRef.current.publish({
      destination: `/app/campana/${campanaId}/chat.enviar`,
      body: JSON.stringify({
        autor: autorNombre,
        colorAutor: autorColor,
        texto,
        tipo: 'mensaje',
        timestamp: hora(),
      }),
    });

    setInputChat('');
  }, [inputChat, nombreMaster, colorMaster, campanaId, jugadorActual]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  // ── TIRAR DADO ────────────────────────────────────────
  const lanzarDado = (caras: number, label: string) => {
    const resultado = tirarDado(caras);
    setDadoActivo(label);
    setResultadoActivo(resultado);
  };

  // ── CUANDO TERMINA LA ANIMACIÓN ───────────────────────
  const handleAnimacionFin = useCallback(() => {
    if (dadoActivo === null || resultadoActivo === null) return;

    const autorNombre = jugadorActual?.nombre || nombreMaster;
    const autorColor = jugadorActual?.color || COLORES_CLASES[jugadorActual?.clase || ''] || colorMaster;

    const total = resultadoActivo + modificador;
    const msg: MensajeChat = {
      id: Date.now().toString(),
      autor: autorNombre,
      colorAutor: autorColor,
      texto: '',
      tipo: 'tirada',
      timestamp: hora(),
      tirada: { dado: dadoActivo, resultado: resultadoActivo, modificador, total },
    };

    if (stompRef.current?.connected && campanaId) {
      stompRef.current.publish({
        destination: `/app/campana/${campanaId}/chat.enviar`,
        body: JSON.stringify(msg),
      });
    } else {
      setMensajes(prev => [...prev, msg]);
    }

    setDadoActivo(null);
    setResultadoActivo(null);
    // Removemos el cambio automático de pestaña, así se queda donde el usuario estaba
  }, [dadoActivo, resultadoActivo, modificador, nombreMaster, colorMaster, campanaId, jugadorActual]);

  // Si nos pasan jugadores, los mapeamos al formato visual. Si no, usamos los de DEMO.
  const jugadoresAMostrar = (jugadoresRed.length > 0 ? jugadoresRed : (jugadores !== undefined ? jugadores : JUGADORES_DEMO))
    .map((j: any, i: number) => ({
        id: j.id?.toString() || i.toString(),
        nombre: j.nombre || j.usuarioNombre || 'Aventurero',
        clase: j.clase || 'Desconocida',
        hp: j.hp || 10,
        hpMax: j.hpMax || 10,
        color: j.color || COLORES_CLASES[j.clase] || '#4a90d9',
        conectado: j.conectado !== false
      }));

   const crearPeerConnection = (peerId: string): RTCPeerConnection => {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });

          // Añadir tracks del micrófono local
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
              pc.addTrack(track, localStreamRef.current!);
            });
          }

          // Enviar ICE candidates al otro usuario
          pc.onicecandidate = (event) => {
            console.log('ICE candidate:', event.candidate);
            if (event.candidate && stompRef.current?.connected && campanaId) {
              const miId = jugadorActual?.id?.toString() || 'master';
              stompRef.current.publish({
                destination: `/app/campana/${campanaId}/voice`,
                body: JSON.stringify({ tipo: 'ice-candidate', de: miId, candidate: event.candidate }),
              });
            }
          };

          // Reproducir audio remoto
          pc.ontrack = (event) => {
            console.log('🎙 Audio recibido de:', peerId, event.streams);
            const audio = document.createElement('audio');
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
            audio.volume = 1.0;
            document.body.appendChild(audio);
            audio.play().catch(e => console.error('Error reproduciendo audio:', e));
            setUsuariosVoz(prev => [...new Set([...prev, peerId])]);
          };

          peersRef.current.set(peerId, pc);
          return pc;
}; 
    const toggleMic = async () => {
       console.log('jugadores en sala:', jugadoresAMostrar); 
      if (!micActivo) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          setMicActivo(true);

          // Conectar con cada jugador de la sala
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
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setMicActivo(false);
        setUsuariosVoz([]);
      }
    };

return (
    <div className="pp-panel">

      {/* ANIMACIÓN DADO */}
      <DiceRoller
        dado={dadoActivo}
        resultado={resultadoActivo}
        onAnimacionFin={handleAnimacionFin}
      />

      {/* INDICADOR CONEXIÓN */}
      <div className="pp-conexion">
        <span className={`pp-conexion-dot ${conectado ? 'online' : 'offline'}`} />
        <span className="pp-conexion-texto">{conectado ? 'En línea' : 'Sin conexión'}</span>
      </div>

      {panelSuperior && (
        <div className="pp-panel-superior">{panelSuperior}</div>
      )}

      {/* PESTAÑAS */}
      <div className="pp-tabs">
        <button className={`pp-tab ${pestana === 'chat' ? 'active' : ''}`} onClick={() => setPestana('chat')}>
           <Comment width={16} height={16} style={{ marginRight: 4 }} />
        </button>
        <button className={`pp-tab ${pestana === 'jugadores' ? 'active' : ''}`} onClick={() => setPestana('jugadores')}>
          <Users width={16} height={16} style={{ marginRight: 4 }} />
        </button>
        <button className={`pp-tab ${pestana === 'dados' ? 'active' : ''}`} onClick={() => setPestana('dados')}>
          <Dices width={16} height={16} style={{ marginRight: 4 }} />
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
              <div key={msg.id} className={`pp-msg pp-msg--${msg.tipo}`}>

                {msg.tipo === 'sistema' && (
                  <span className="pp-msg-sistema">⚔ {msg.texto}</span>
                )}

                {msg.tipo === 'mensaje' && (
                  <>
                    <div className="pp-msg-cabecera">
                      <span className="pp-msg-autor" style={{ color: msg.colorAutor }}>{msg.autor}</span>
                      <span className="pp-msg-hora">{msg.timestamp}</span>
                    </div>
                    <p className="pp-msg-texto">{msg.texto}</p>
                  </>
                )}

                {msg.tipo === 'tirada' && msg.tirada && (
                  <>
                    <div className="pp-msg-cabecera">
                      <span className="pp-msg-autor" style={{ color: msg.colorAutor }}>{msg.autor}</span>
                      <span className="pp-msg-hora">{msg.timestamp}</span>
                    </div>
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
                  </>
                )}

              </div>
            ))}
          </div>

          <div className="pp-chat-input-wrap">
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
      )}

      {/* ── JUGADORES ── */}
      {pestana === 'jugadores' && (
        <div className="pp-seccion">
          <div className="pp-jugadores-lista">
            {jugadoresAMostrar.length > 0 ? (
              jugadoresAMostrar.map(j => (
                <div key={j.id} className={`pp-jugador ${j.conectado ? '' : 'desconectado'}`}>
                  <div className="pp-jugador-cabecera">
                    <span className="pp-jugador-dot" style={{ background: j.conectado ? j.color : '#555' }} />
                    <span className="pp-jugador-nombre">{j.nombre}</span>
                    <span className="pp-jugador-clase">{j.clase}</span>
                    {!j.conectado && <span className="pp-jugador-off">desconectado</span>}
                  </div>
                  <div className="pp-jugador-hp-wrap">
                    <span className="pp-jugador-hp-label">HP</span>
                    <div className="pp-jugador-hp-barra">
                      <div
                        className="pp-jugador-hp-fill"
                        style={{
                          width: `${(j.hp / j.hpMax) * 100}%`,
                          background: j.hp / j.hpMax > 0.5 ? '#2ecc71' : j.hp / j.hpMax > 0.25 ? '#f39c12' : '#e74c3c',
                        }}
                      />
                    </div>
                    <span className="pp-jugador-hp-num">{j.hp}/{j.hpMax}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="tb-vacio" style={{ textAlign: 'center', opacity: 0.5, fontSize: '13px', paddingTop: '20px' }}>
                Sin jugadores en la partida
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── DADOS ── */}
      {pestana === 'dados' && (
        <div className="pp-seccion pp-dados-wrap">
          <p className="pp-dados-hint">Haz clic en un dado para lanzarlo</p>

          <div className="pp-dados-grid">
            {DADOS.map(({ caras, label }) => (
              <button
                key={label}
                className={`pp-dado-btn ${dadoActivo === label ? 'animando' : ''}`}
                onClick={() => lanzarDado(caras, label)}
                disabled={dadoActivo !== null}
              >
                <span className="pp-dado-icono">{dadoActivo === label ? '💫' : '⬡'}</span>
                <span className="pp-dado-label">{label}</span>
              </button>
            ))}
          </div>

          <div className="pp-modificador-wrap">
            <label className="pp-mod-label">Modificador</label>
            <div className="pp-mod-controles">
              <button className="pp-mod-btn" onClick={() => setModificador(m => m - 1)}>−</button>
              <span className="pp-mod-valor">{modificador >= 0 ? `+${modificador}` : modificador}</span>
              <button className="pp-mod-btn" onClick={() => setModificador(m => m + 1)}>+</button>
            </div>
          </div>

          <p className="pp-dados-hint" style={{ marginTop: 12 }}>
            El resultado aparecerá en el chat
          </p>
        </div>
      )}

      {/* ── VOZ ── */}
      {pestana === 'voz' && (
        <div className="pp-seccion pp-voz-wrap">
          <p className="pp-dados-hint">Canal de voz de la partida</p>

          <button
            className={`pp-mic-btn ${micActivo ? 'activo' : ''}`}
            onClick={toggleMic}
          >
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

    </div>
  );
}