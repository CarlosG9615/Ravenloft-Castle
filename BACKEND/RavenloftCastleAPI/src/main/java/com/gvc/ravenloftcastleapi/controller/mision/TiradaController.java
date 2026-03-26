package com.gvc.ravenloftcastleapi.controller.mision;

import com.gvc.ravenloftcastleapi.dto.tirada.HistorialTiradasDTO;
import com.gvc.ravenloftcastleapi.dto.tirada.TiradaDadoCreateDTO;
import com.gvc.ravenloftcastleapi.dto.tirada.TiradaDadoResponseDTO;
import com.gvc.ravenloftcastleapi.dto.tirada.TiradaDadoUpdateDTO;
import com.gvc.ravenloftcastleapi.service.TiradaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/misiones/{misionId}/tiradas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class TiradaController {

    private final TiradaService tiradaService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    public ResponseEntity<TiradaDadoResponseDTO> create(@PathVariable Long misionId,
                                                        @Valid @RequestBody TiradaDadoCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tiradaService.crearEnMision(getCurrentUserEmail(), misionId, dto));
    }

    @GetMapping
    public ResponseEntity<List<TiradaDadoResponseDTO>> list(@PathVariable Long misionId) {
        return ResponseEntity.ok(tiradaService.listarPorMision(getCurrentUserEmail(), misionId));
    }

    @GetMapping("/{tiradaId}")
    public ResponseEntity<TiradaDadoResponseDTO> getById(@PathVariable Long misionId, @PathVariable Long tiradaId) {
        return ResponseEntity.ok(tiradaService.getByIdEnMision(getCurrentUserEmail(), misionId, tiradaId));
    }

    @PutMapping("/{tiradaId}")
    public ResponseEntity<TiradaDadoResponseDTO> update(@PathVariable Long misionId,
                                                        @PathVariable Long tiradaId,
                                                        @Valid @RequestBody TiradaDadoUpdateDTO dto) {
        return ResponseEntity.ok(tiradaService.actualizarEnMision(getCurrentUserEmail(), misionId, tiradaId, dto));
    }

    @DeleteMapping("/{tiradaId}")
    public ResponseEntity<Void> delete(@PathVariable Long misionId, @PathVariable Long tiradaId) {
        tiradaService.eliminarEnMision(getCurrentUserEmail(), misionId, tiradaId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/personajes/{personajeId}/historial")
    public ResponseEntity<HistorialTiradasDTO> historial(@PathVariable Long misionId, @PathVariable Long personajeId) {
        return ResponseEntity.ok(tiradaService.historialPorPersonajeEnMision(getCurrentUserEmail(), misionId, personajeId));
    }
}

