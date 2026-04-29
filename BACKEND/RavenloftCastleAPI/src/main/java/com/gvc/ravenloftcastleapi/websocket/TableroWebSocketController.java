package com.gvc.ravenloftcastleapi.websocket;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Controller
public class TableroWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    // Map of CampaignId -> Map of SessionId -> Player Info
    private final Map<String, Map<String, JugadorWsDTO>> sessionesCampana = new ConcurrentHashMap<>();

    public TableroWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/campana/{campanaId}/join")
    public void joinCampana(@DestinationVariable String campanaId, @Payload JugadorWsDTO jugador) {
        sessionesCampana.putIfAbsent(campanaId, new ConcurrentHashMap<>());

        // Use a unique ID from the user or generate one if not present
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

    private void broadcastJugadores(String campanaId) {
        List<JugadorWsDTO> jugadores = new ArrayList<>(sessionesCampana.getOrDefault(campanaId, new ConcurrentHashMap<>()).values());
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/jugadores", jugadores);
    }

    @MessageMapping("/campana/{campanaId}/chat.enviar")
    public void enviarMensajeChat(@DestinationVariable String campanaId, @Payload MensajeChatDTO mensaje) {
        messagingTemplate.convertAndSend("/topic/campana/" + campanaId + "/chat", mensaje);
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
}

