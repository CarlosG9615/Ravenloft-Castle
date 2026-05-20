package com.gvc.ravenloftcastleapi.controller.mision;

import com.gvc.ravenloftcastleapi.dto.mision.MisionCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionEscenarioCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionUpdateDTO;
import com.gvc.ravenloftcastleapi.service.MisionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/misiones")
@RequiredArgsConstructor
public class MisionController {

    private final MisionService misionService;

    @GetMapping("/{id}")
    public ResponseEntity<MisionDetalleDTO> obtenerMision(@PathVariable Long id) {
        return ResponseEntity.ok(misionService.obtenerMisionPorId(id));
    }

    @PostMapping
    public ResponseEntity<MisionDetalleDTO> crearMision(@Valid @RequestBody MisionCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(misionService.crearMision(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MisionDetalleDTO> actualizarMision(
            @PathVariable Long id,
            @Valid @RequestBody MisionUpdateDTO dto) {
        return ResponseEntity.ok(misionService.actualizarMision(id, dto));
    }

    @PatchMapping("/{id}/completada")
    public ResponseEntity<Void> marcarComoCompletada(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean completada) {
        misionService.marcarComoCompletada(id, completada);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarMision(@PathVariable Long id) {
        misionService.eliminarMision(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/escenarios")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MisionDetalleDTO> vincularEscenario(
            @PathVariable Long id,
            @Valid @RequestBody MisionEscenarioCreateDTO dto) {
        MisionDetalleDTO misionActualizada = misionService.vincularEscenario(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(misionActualizada);
    }

    @DeleteMapping("/{misionId}/escenarios/{escenarioId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MisionDetalleDTO> desvincularEscenario(
            @PathVariable Long misionId,
            @PathVariable Long escenarioId) {
        MisionDetalleDTO misionActualizada = misionService.desvincularEscenario(misionId, escenarioId);
        return ResponseEntity.ok(misionActualizada);
    }

    @PatchMapping("/{misionId}/escenarios/{escenarioId}/dificultad")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MisionDetalleDTO> actualizarDificultadEscenario(
            @PathVariable Long misionId,
            @PathVariable Long escenarioId,
            @RequestParam int dificultad) {
        MisionDetalleDTO misionActualizada = misionService.actualizarDificultadEscenario(misionId, escenarioId, dificultad);
        return ResponseEntity.ok(misionActualizada);
    }

    @PostMapping("/{id}/config-partida")
    public ResponseEntity<Void> guardarConfigPartida(
            @PathVariable Long id,
            @RequestBody String configPartida) {
        try {
            misionService.guardarConfigPartida(id, configPartida);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}/config-partida")
    public ResponseEntity<String> obtenerConfigPartida(@PathVariable Long id) {
        try {
            String configJson = misionService.obtenerConfigPartida(id);
            if (configJson == null || configJson.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(configJson);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
