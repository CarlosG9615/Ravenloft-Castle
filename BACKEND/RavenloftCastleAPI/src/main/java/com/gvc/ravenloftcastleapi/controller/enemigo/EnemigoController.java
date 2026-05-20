package com.gvc.ravenloftcastleapi.controller.enemigo;

import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoCreateDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.StatsUpdateDTO;
import com.gvc.ravenloftcastleapi.service.EnemigosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EnemigoDetalleDTO> crearEnemigo(@Valid @RequestBody EnemigoCreateDTO dto) {
        EnemigoDetalleDTO creado = enemigosService.crearEnemigo(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PatchMapping("/{id}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EnemigoDetalleDTO> editarStatsEnemigo(
            @PathVariable Long id,
            @Valid @RequestBody StatsUpdateDTO statsDto) {
        EnemigoDetalleDTO actualizado = enemigosService.editarStats(id, statsDto);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarEnemigo(@PathVariable Long id) {
        enemigosService.eliminarEnemigo(id);
        return ResponseEntity.noContent().build();
    }
}
