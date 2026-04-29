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

