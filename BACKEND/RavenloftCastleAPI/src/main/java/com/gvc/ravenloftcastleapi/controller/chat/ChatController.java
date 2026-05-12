package com.gvc.ravenloftcastleapi.controller.chat;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gvc.ravenloftcastleapi.entity.MensajeChatPersistido;
import com.gvc.ravenloftcastleapi.repository.MensajeChatRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/misiones")
@RequiredArgsConstructor
public class ChatController {

    private final MensajeChatRepository mensajeChatRepository;

    @GetMapping("/{misionId}/chat")
    public ResponseEntity<List<Map<String, Object>>> getChat(
            @PathVariable Long misionId,
            @RequestParam(required = false) String since) {

        List<MensajeChatPersistido> mensajes;
        if (since != null && !since.isBlank()) {
            try {
                LocalDateTime sinceDateTime = Instant.parse(since)
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime();
                mensajes = mensajeChatRepository
                        .findByMisionIdAndCreadoEnAfterOrderByCreadoEnAsc(misionId, sinceDateTime);
            } catch (Exception e) {
                mensajes = mensajeChatRepository.findByMisionIdOrderByCreadoEnAsc(misionId);
            }
        } else {
            mensajes = mensajeChatRepository.findByMisionIdOrderByCreadoEnAsc(misionId);
        }

        List<Map<String, Object>> result = mensajes.stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> toMap(MensajeChatPersistido m) {
        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("id", m.getId() != null ? m.getId().toString() : "");
        msg.put("autor", m.getAutor() != null ? m.getAutor() : "");
        msg.put("colorAutor", m.getColorAutor() != null ? m.getColorAutor() : "#8b0000");
        msg.put("texto", m.getTexto() != null ? m.getTexto() : "");
        msg.put("tipo", m.getTipo() != null ? m.getTipo() : "mensaje");
        msg.put("timestamp", m.getTimestamp() != null ? m.getTimestamp() : "");

        if (m.getTiradaDado() != null) {
            Map<String, Object> tirada = new LinkedHashMap<>();
            tirada.put("dado", m.getTiradaDado());
            tirada.put("resultado", Objects.requireNonNullElse(m.getTiradaResultado(), 0));
            tirada.put("modificador", Objects.requireNonNullElse(m.getTiradaModificador(), 0));
            tirada.put("total", Objects.requireNonNullElse(m.getTiradaTotal(), 0));
            if (m.getTiradaImagenes() != null && !m.getTiradaImagenes().isBlank()) {
                tirada.put("imagenes", Arrays.asList(m.getTiradaImagenes().split(",")));
            }
            msg.put("tirada", tirada);
        }

        return msg;
    }
}
