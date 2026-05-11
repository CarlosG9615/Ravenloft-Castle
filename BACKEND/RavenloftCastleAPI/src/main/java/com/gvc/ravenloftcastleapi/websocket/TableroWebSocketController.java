package com.gvc.ravenloftcastleapi.websocket;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.gvc.ravenloftcastleapi.dto.mision.FinTurnoDTO;
import com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO;
import com.gvc.ravenloftcastleapi.dto.mision.TurnoDTO;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.service.TurnoService;

@Controller
public class TableroWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MisionParticipanteRepository misionParticipanteRepository;
    private final TurnoService turnoService;
    // Map of CampaignId -> Map of SessionId -> Player Info
    private final Map<String, Map<String, JugadorWsDTO>> sessionesCampana = new ConcurrentHashMap<>();
    // Map of CampaignId -> Map of TokenId -> Token State
    private final Map<String, Map<String, CampanaTokenStateDTO>> tokensCampana = new ConcurrentHashMap<>();

    public TableroWebSocketController(SimpMessagingTemplate messagingTemplate,
                                      MisionParticipanteRepository misionParticipanteRepository,
                                      TurnoService turnoService) {
        this.messagingTemplate = messagingTemplate;
        this.misionParticipanteRepository = misionParticipanteRepository;
        this.turnoService = turnoService;
    }


    @MessageMapping("/campana/{campanaId}/join")
    public void joinCampana(@DestinationVariable String campanaId, @Payload JugadorWsDTO jugador) {
        sessionesCampana.putIfAbsent(campanaId, new ConcurrentHashMap<>());

        String idKey = jugador.getId() != null ? jugador.getId().toString() : String.valueOf(System.currentTimeMillis());

        jugador.setConectado(true);
        sessionesCampana.get(campanaId).put(idKey, jugador);

        broadcastJugadores(campanaId);
    }

    @MessageMapping("/campana/{campanaId}/leave")
    public void leaveCampana(@DestinationVariable String campanaId, @Payload String jugadorId) {
        if (sessionesCampana.containsKey(campanaId)) {
            sessionesCampana.get(campanaId).remove(jugadorId);
            broadcastJugadores(campanaId);
        }
    }

    @MessageMapping("/mision/{misionId}/token-move")
    public void tokenMove(@DestinationVariable String misionId, @Payload TokenMoveDTO move) {
        try {
            misionParticipanteRepository.actualizarPosicionToken(Long.valueOf(misionId), Long.valueOf(move.getUserId()), move.getCol(), move.getRow());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("IDs inválidos para token-move", e);
        }

        messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/tokens", move);
    }

    @MessageMapping("/mision/{misionId}/token-request-sync")
    public void tokenRequestSync(@DestinationVariable String misionId, @Payload TokenSyncRequestDTO request) {
        try {
            List<ParticipanteJugadorDTO> participantes = misionParticipanteRepository.findParticipantesJugadores(Long.valueOf(misionId));
            List<TokenStateDTO> tokenStates = new ArrayList<>();
            for (ParticipanteJugadorDTO p : participantes) {
                if (p.tokenCol() != null && p.tokenRow() != null) {
                    tokenStates.add(new TokenStateDTO(
                        p.usuarioId().toString(),
                        p.tokenCol(),
                        p.tokenRow()
                    ));
                }
            }
            
            messagingTemplate.convertAndSendToUser(
                request.getSessionId(),
                "/queue/mision/" + misionId + "/token-sync",
                tokenStates
            );
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para token-request-sync", e);
        }
    }

    private void broadcastJugadores(String campanaId) {
        List<JugadorWsDTO> jugadores = new ArrayList<>(sessionesCampana.getOrDefault(campanaId, new ConcurrentHashMap<>()).values());
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/jugadores", jugadores);
    }

    @MessageMapping("/campana/{campanaId}/chat.enviar")
    public void enviarMensajeChat(@DestinationVariable String campanaId, @Payload MensajeChatDTO mensaje) {
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/chat", mensaje);
    }

    @MessageMapping("/mision/{misionId}/fin-turno")
    public void finTurno(@DestinationVariable String misionId, @Payload FinTurnoDTO dto) {
        try {
            TurnoDTO siguiente = turnoService.calcularSiguiente(Long.valueOf(misionId), dto.personajeId());
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno", siguiente);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para fin-turno", e);
        }
    }

    @MessageMapping("/mision/{misionId}/iniciar-ronda")
    public void iniciarRonda(@DestinationVariable String misionId) {
        try {
            TurnoDTO turnoInicial = turnoService.obtenerTurnoInicial(Long.valueOf(misionId));
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno", turnoInicial);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para iniciar-ronda", e);
        }
    }

    @MessageMapping("/mision/{misionId}/join")
    public void joinMision(@DestinationVariable String misionId) {
        try {
            TurnoDTO turnoInicial = turnoService.obtenerTurnoInicial(Long.valueOf(misionId));
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno", turnoInicial);
            List<ParticipanteJugadorDTO> participantes = misionParticipanteRepository.findParticipantesJugadores(Long.valueOf(misionId));
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/jugadores", participantes);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para join mision", e);
        }
    }

    @MessageMapping("/campana/{campanaId}/token-move")
    public void campanaTokenMove(@DestinationVariable String campanaId, @Payload CampanaTokenMoveDTO move) {
        tokensCampana.putIfAbsent(campanaId, new ConcurrentHashMap<>());
        if (move.getTokenId() == null || move.getTokenId().isBlank()) {
            return;
        }

        CampanaTokenStateDTO state = new CampanaTokenStateDTO(
            move.getTokenId(),
            move.getOwnerId(),
            move.getTipo(),
            move.getNombre(),
            move.getColor(),
            move.getCol(),
            move.getRow(),
            move.getMapaUrl()
        );

        tokensCampana.get(campanaId).put(move.getTokenId(), state);
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/tokens", state);
    }

    @MessageMapping("/campana/{campanaId}/token-request-sync")
    public void campanaTokenRequestSync(@DestinationVariable String campanaId, @Payload TokenSyncRequestDTO request) {
        List<CampanaTokenStateDTO> tokenStates = new ArrayList<>(
            tokensCampana.getOrDefault(campanaId, new ConcurrentHashMap<>()).values()
        );
        messagingTemplate.convertAndSend(
            "/topic/campana/" + campanaId + "/token-sync",
            tokenStates
        );
    }

    public static class MensajeChatDTO {
        private String id;
        private String autor;
        private String colorAutor;
        private String texto;
        private String tipo;
        private String timestamp;
        private Object tirada;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getAutor() { return autor; }
        public void setAutor(String autor) { this.autor = autor; }
        public String getColorAutor() { return colorAutor; }
        public void setColorAutor(String colorAutor) { this.colorAutor = colorAutor; }
        public String getTexto() { return texto; }
        public void setTexto(String texto) { this.texto = texto; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public Object getTirada() { return tirada; }
        public void setTirada(Object tirada) { this.tirada = tirada; }
    }

    public static class JugadorWsDTO {
        private Long id;
        private String nombre;
        private String clase;
        private Integer hp;
        private Integer hpMax;
        private Boolean conectado;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getClase() { return clase; }
        public void setClase(String clase) { this.clase = clase; }
        public Integer getHp() { return hp; }
        public void setHp(Integer hp) { this.hp = hp; }
        public Integer getHpMax() { return hpMax; }
        public void setHpMax(Integer hpMax) { this.hpMax = hpMax; }
        public Boolean getConectado() { return conectado; }
        public void setConectado(Boolean conectado) { this.conectado = conectado; }
    }
    @MessageMapping("/campana/{campanaId}/voice")
    public void señalizarVoz(@DestinationVariable String campanaId, @Payload Map<String, Object> señal) {
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/voice", (Object) señal);
    }

    public static class TokenMoveDTO {
        private String userId;
        private int col;
        private int row;

        public TokenMoveDTO() {
        }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
    }

    public static class TokenSyncRequestDTO {
        private String sessionId;

        public TokenSyncRequestDTO() {
        }

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    }

    public static class TokenStateDTO {
        private String userId;
        private int col;
        private int row;

        public TokenStateDTO(String userId, int col, int row) {
            this.userId = userId;
            this.col = col;
            this.row = row;
        }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
    }

    public static class CampanaTokenMoveDTO {
        private String tokenId;
        private String ownerId;
        private String tipo;
        private String nombre;
        private String color;
        private int col;
        private int row;
        private String mapaUrl;

        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
        public String getMapaUrl() { return mapaUrl; }
        public void setMapaUrl(String mapaUrl) { this.mapaUrl = mapaUrl; }
    }

    public static class CampanaTokenStateDTO {
        private String tokenId;
        private String ownerId;
        private String tipo;
        private String nombre;
        private String color;
        private int col;
        private int row;
        private String mapaUrl;

        public CampanaTokenStateDTO(String tokenId, String ownerId, String tipo, String nombre, String color, int col, int row, String mapaUrl) {
            this.tokenId = tokenId;
            this.ownerId = ownerId;
            this.tipo = tipo;
            this.nombre = nombre;
            this.color = color;
            this.col = col;
            this.row = row;
            this.mapaUrl = mapaUrl;
        }

        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
        public String getMapaUrl() { return mapaUrl; }
        public void setMapaUrl(String mapaUrl) { this.mapaUrl = mapaUrl; }
    }
}
