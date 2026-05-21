package com.gvc.ravenloftcastleapi.controller.enemigo;

import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoDetalleDTO;
import com.gvc.ravenloftcastleapi.service.EnemigosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/enemigos")
@RequiredArgsConstructor
public class EnemigoController {

    private final EnemigosService enemigosService;

    @GetMapping
    public ResponseEntity<List<EnemigoDetalleDTO>> listarEnemigos() {
        return ResponseEntity.ok(enemigosService.getEnemigos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnemigoDetalleDTO> obtenerEnemigoPorId(@PathVariable Long id) {
        return ResponseEntity.ok(enemigosService.getEnemigoById(id));
    }
}
