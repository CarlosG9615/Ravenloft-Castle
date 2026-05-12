package com.gvc.ravenloftcastleapi.controller;

import com.gvc.ravenloftcastleapi.dto.NotificacionDTO;
import com.gvc.ravenloftcastleapi.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping("/mis-notificaciones")
    public ResponseEntity<List<NotificacionDTO>> getMisNotificaciones() {
        return ResponseEntity.ok(notificacionService.getMisNotificaciones());
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<Long> contarNoLeidas() {
        return ResponseEntity.ok(notificacionService.contarNoLeidas());
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<Void> marcarComoLeida(@PathVariable Long id) {
        notificacionService.marcarComoLeida(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodasComoLeidas() {
        notificacionService.marcarTodasComoLeidas();
        return ResponseEntity.noContent().build();
    }
}
