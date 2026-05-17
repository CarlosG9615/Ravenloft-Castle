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
import com.gvc.ravenloftcastleapi.entity.MensajeChatPersistido;
import com.gvc.ravenloftcastleapi.repository.MensajeChatRepository;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.service.TurnoService;

@Controller
public class TableroWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MisionParticipanteRepository misionParticipanteRepository;
    private final TurnoService turnoService;
    private final MensajeChatRepository mensajeChatRepository;
    private final Map<String, Map<String, JugadorWsDTO>> sessionesCampana = new ConcurrentHashMap<>();
    private final Map<String, Map<String, CampanaTokenStateDTO>> tokensCampana = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Integer>> hpOverridesCampana = new ConcurrentHashMap<>();
    private final Map<String, PartidaConfigDTO> partidasConfiguradas = new ConcurrentHashMap<>();

    public TableroWebSocketController(SimpMessagingTemplate messagingTemplate,
                                      MisionParticipanteRepository misionParticipanteRepository,
                                      TurnoService turnoService,
                                      MensajeChatRepository mensajeChatRepository) {
        this.messagingTemplate = messagingTemplate;
        this.misionParticipanteRepository = misionParticipanteRepository;
        this.turnoService = turnoService;
        this.mensajeChatRepository = mensajeChatRepository;
    }

    @MessageMapping("/campana/{campanaId}/join")
    public void joinCampana(@DestinationVariable String campanaId, @Payload JugadorWsDTO jugador) {
        sessionesCampana.putIfAbsent(campanaId, new ConcurrentHashMap<>());
        String idKey = jugador.getId() != null ? jugador.getId().toString() : String.valueOf(System.currentTimeMillis());
        jugador.setConectado(true);

        // Aplicar HP override si existe
        Map<String, Integer> hpOverrides = hpOverridesCampana.get(campanaId);
        if (hpOverrides != null && hpOverrides.containsKey(idKey)) {
            jugador.setHp(hpOverrides.get(idKey));
        }

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

    @MessageMapping("/campana/{campanaId}/hp-update")
    public void hpUpdate(@DestinationVariable String campanaId, @Payload HpUpdateDTO dto) {
        // Guardar el override en memoria
        hpOverridesCampana.putIfAbsent(campanaId, new ConcurrentHashMap<>());
        hpOverridesCampana.get(campanaId).put(dto.getJugadorId(), dto.getHp());

        // Actualizar el jugador en sesión si está conectado
        Map<String, JugadorWsDTO> sesiones = sessionesCampana.get(campanaId);
        if (sesiones != null && sesiones.containsKey(dto.getJugadorId())) {
            sesiones.get(dto.getJugadorId()).setHp(dto.getHp());
        }

        // Broadcast a todos
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/hp-update", dto);
    }

    @MessageMapping("/mision/{misionId}/token-move")
    public void tokenMove(@DestinationVariable String misionId, @Payload TokenMoveDTO move) {
        try {
            misionParticipanteRepository.actualizarPosicionToken(
                    Long.valueOf(misionId), Long.valueOf(move.getUserId()), move.getCol(), move.getRow());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("IDs inválidos para token-move", e);
        }
        messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/tokens", move);
    }

    @MessageMapping("/mision/{misionId}/token-request-sync")
    public void tokenRequestSync(@DestinationVariable String misionId, @Payload TokenSyncRequestDTO request) {
        try {
            List<ParticipanteJugadorDTO> participantes =
                    misionParticipanteRepository.findParticipantesJugadores(Long.valueOf(misionId));
            List<TokenStateDTO> tokenStates = new ArrayList<>();
            for (ParticipanteJugadorDTO p : participantes) {
                if (p.tokenCol() != null && p.tokenRow() != null) {
                    tokenStates.add(new TokenStateDTO(p.personajeId().toString(), p.tokenCol(), p.tokenRow()));
                }
            }
            messagingTemplate.convertAndSendToUser(
                    request.getSessionId(),
                    "/queue/mision/" + misionId + "/token-sync",
                    tokenStates);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para token-request-sync", e);
        }
    }

    @MessageMapping("/mision/{misionId}/fin-turno")
    public void finTurno(@DestinationVariable String misionId, @Payload FinTurnoDTO dto) {
        try {
            Long mid = Long.valueOf(misionId);
            TurnoDTO siguiente = turnoService.calcularSiguiente(mid, dto.personajeId());
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno", siguiente);
            List<ParticipanteJugadorDTO> participantes =
                    misionParticipanteRepository.findParticipantesJugadores(mid);
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/jugadores", participantes);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para fin-turno", e);
        }
    }

    @MessageMapping("/mision/{misionId}/iniciar-ronda")
    public void iniciarRonda(@DestinationVariable String misionId) {
        try {
            Long mid = Long.valueOf(misionId);
            TurnoDTO turnoInicial = turnoService.iniciarNuevaRonda(mid);
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno", turnoInicial);
            List<ParticipanteJugadorDTO> participantes =
                    misionParticipanteRepository.findParticipantesJugadores(mid);
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/jugadores", participantes);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para iniciar-ronda", e);
        }
    }

    @MessageMapping("/mision/{misionId}/join")
    public void joinMision(@DestinationVariable String misionId) {
        try {
            Long mid = Long.valueOf(misionId);
            TurnoDTO turnoActual = turnoService.obtenerTurnoActual(mid);
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno", turnoActual);
            List<ParticipanteJugadorDTO> participantes =
                    misionParticipanteRepository.findParticipantesJugadores(mid);
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/jugadores", participantes);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para join mision", e);
        }
    }

    @MessageMapping("/mision/{misionId}/dado-movimiento")
    public void dadoMovimiento(@DestinationVariable String misionId, @Payload DadoRollWsDTO dto) {
        try {
            misionParticipanteRepository.actualizarMovimientoRoll(
                    Long.valueOf(misionId), dto.getPersonajeId(), dto.getValor());
            dto.setTipo("movimiento");
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/dado-roll", dto);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para dado-movimiento", e);
        }
    }

    @MessageMapping("/mision/{misionId}/dado-ataque")
    public void dadoAtaque(@DestinationVariable String misionId, @Payload DadoRollWsDTO dto) {
        try {
            misionParticipanteRepository.actualizarAtaqueRoll(
                    Long.valueOf(misionId), dto.getPersonajeId(), dto.getValor());
            dto.setTipo("ataque");
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/dado-roll", dto);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("misionId inválido para dado-ataque", e);
        }
    }

    @MessageMapping("/campana/{campanaId}/token-move")
    public void campanaTokenMove(@DestinationVariable String campanaId, @Payload CampanaTokenMoveDTO move) {
        tokensCampana.putIfAbsent(campanaId, new ConcurrentHashMap<>());
        if (move.getTokenId() == null || move.getTokenId().isBlank()) {
            return;
        }
        CampanaTokenStateDTO state = new CampanaTokenStateDTO(
                move.getTokenId(), move.getOwnerId(), move.getTipo(), move.getNombre(),
                move.getColor(), move.getCol(), move.getRow(), move.getMapaUrl()
        );
        tokensCampana.get(campanaId).put(move.getTokenId(), state);
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/tokens", state);
    }

    @MessageMapping("/campana/{campanaId}/token-delete")
    public void campanaTokenDelete(@DestinationVariable String campanaId, @Payload CampanaTokenDeleteDTO delete) {
        if (delete.getTokenId() == null || delete.getTokenId().isBlank()) return;
        Map<String, CampanaTokenStateDTO> tokens = tokensCampana.get(campanaId);
        if (tokens != null) tokens.remove(delete.getTokenId());
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/token-delete", delete);
    }

    @MessageMapping("/campana/{campanaId}/token-request-sync")
    public void campanaTokenRequestSync(@DestinationVariable String campanaId, @Payload TokenSyncRequestDTO request) {
        List<CampanaTokenStateDTO> tokenStates = new ArrayList<>(
                tokensCampana.getOrDefault(campanaId, new ConcurrentHashMap<>()).values());
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/token-sync", tokenStates);
    }

    @MessageMapping("/campana/{campanaId}/chat.enviar")
    public void enviarMensajeChat(@DestinationVariable String campanaId, @Payload MensajeChatDTO mensaje) {
        try {
            Long misionId = Long.valueOf(campanaId);
            MensajeChatPersistido.MensajeChatPersistidoBuilder builder = MensajeChatPersistido.builder()
                    .misionId(misionId)
                    .personajeId(mensaje.getPersonajeId())
                    .usuarioId(mensaje.getUsuarioId())
                    .autor(mensaje.getAutor())
                    .colorAutor(mensaje.getColorAutor())
                    .texto(mensaje.getTexto())
                    .tipo(mensaje.getTipo())
                    .timestamp(mensaje.getTimestamp());

            if (mensaje.getTirada() instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> t = (Map<String, Object>) mensaje.getTirada();
                builder.tiradaDado(t.get("dado") instanceof String s ? s : null);
                builder.tiradaResultado(t.get("resultado") instanceof Number n ? n.intValue() : null);
                builder.tiradaModificador(t.get("modificador") instanceof Number n ? n.intValue() : null);
                builder.tiradaTotal(t.get("total") instanceof Number n ? n.intValue() : null);
                if (t.get("imagenes") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<String> imgs = (List<String>) t.get("imagenes");
                    builder.tiradaImagenes(String.join(",", imgs));
                }
            }
            mensajeChatRepository.save(builder.build());
        } catch (IllegalArgumentException | ClassCastException e) {
            System.err.println("[Chat] Error persistiendo mensaje: " + e.getMessage());
        }
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/chat", mensaje);
    }

    @MessageMapping("/campana/{campanaId}/voice")
    public void señalizarVoz(@DestinationVariable String campanaId, @Payload Map<String, Object> señal) {
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/voice", (Object) señal);
    }

    // ── Lobby de preparación de partida ─────────────────────────────────────

    @MessageMapping("/mision/{misionId}/master-listo")
    public void masterListo(@DestinationVariable String misionId, @Payload PartidaConfigDTO config) {
        config.setMisionId(misionId);
        partidasConfiguradas.put(misionId, config);
        messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/partida-lista", config);
    }

    @MessageMapping("/mision/{misionId}/master-abort")
    public void masterAbort(@DestinationVariable String misionId) {
        partidasConfiguradas.remove(misionId);
        messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/kicked",
                (Object) java.util.Map.of("razon", "master_abort"));
    }

    @MessageMapping("/mision/{misionId}/check-partida-lista")
    public void checkPartidaLista(@DestinationVariable String misionId) {
        PartidaConfigDTO config = partidasConfiguradas.get(misionId);
        if (config != null) {
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/partida-lista", config);
        } else {
            messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/master-estado",
                    (Object) java.util.Map.of("listo", false));
        }
    }

    private void broadcastJugadores(String campanaId) {
        List<JugadorWsDTO> jugadores = new ArrayList<>(
                sessionesCampana.getOrDefault(campanaId, new ConcurrentHashMap<>()).values());
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/jugadores", jugadores);
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public static class JugadorWsDTO {
        private Long id;
        private Long usuarioId;
        private String nombre;
        private String clase;
        private Integer hp;
        private Integer hpMax;
        private Boolean conectado;
        private String avatar;
        private String color;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getUsuarioId() { return usuarioId; }
        public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
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
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public static class HpUpdateDTO {
        private String jugadorId;
        private Integer hp;

        public String getJugadorId() { return jugadorId; }
        public void setJugadorId(String jugadorId) { this.jugadorId = jugadorId; }
        public Integer getHp() { return hp; }
        public void setHp(Integer hp) { this.hp = hp; }
    }

    public static class DadoRollWsDTO {
        private Long personajeId;
        private String tipo;
        private Integer valor;

        public Long getPersonajeId() { return personajeId; }
        public void setPersonajeId(Long personajeId) { this.personajeId = personajeId; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
        public Integer getValor() { return valor; }
        public void setValor(Integer valor) { this.valor = valor; }
    }

    public static class MensajeChatDTO {
        private String id;
        private Long personajeId;
        private Long usuarioId;
        private String autor;
        private String colorAutor;
        private String texto;
        private String tipo;
        private String timestamp;
        private Object tirada;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public Long getPersonajeId() { return personajeId; }
        public void setPersonajeId(Long personajeId) { this.personajeId = personajeId; }
        public Long getUsuarioId() { return usuarioId; }
        public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
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

    public static class TokenMoveDTO {
        private String userId;
        private int col;
        private int row;

        public TokenMoveDTO() {}
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
    }

    public static class TokenSyncRequestDTO {
        private String sessionId;

        public TokenSyncRequestDTO() {}
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

    public static class CampanaTokenDeleteDTO {
        private String tokenId;

        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
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

        public CampanaTokenStateDTO(String tokenId, String ownerId, String tipo, String nombre,
                                    String color, int col, int row, String mapaUrl) {
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

    public static class EnemyTokenConfigDTO {
        private String instanciaId;
        private Long enemigoId;
        private String nombre;
        private int col;
        private int row;

        public String getInstanciaId() { return instanciaId; }
        public void setInstanciaId(String instanciaId) { this.instanciaId = instanciaId; }
        public Long getEnemigoId() { return enemigoId; }
        public void setEnemigoId(Long enemigoId) { this.enemigoId = enemigoId; }
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
    }

    public static class TrapTokenConfigDTO {
        private String instanciaId;
        private String trapId;
        private String nombre;
        private String imageUrl;
        private int col;
        private int row;

        public String getInstanciaId() { return instanciaId; }
        public void setInstanciaId(String instanciaId) { this.instanciaId = instanciaId; }
        public String getTrapId() { return trapId; }
        public void setTrapId(String trapId) { this.trapId = trapId; }
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
    }

    public static class PartidaConfigDTO {
        private String misionId;
        private List<EnemyTokenConfigDTO> enemigos;
        private List<TrapTokenConfigDTO> trampas;

        public String getMisionId() { return misionId; }
        public void setMisionId(String misionId) { this.misionId = misionId; }
        public List<EnemyTokenConfigDTO> getEnemigos() { return enemigos; }
        public void setEnemigos(List<EnemyTokenConfigDTO> enemigos) { this.enemigos = enemigos; }
        public List<TrapTokenConfigDTO> getTrampas() { return trampas; }
        public void setTrampas(List<TrapTokenConfigDTO> trampas) { this.trampas = trampas; }
    }
}