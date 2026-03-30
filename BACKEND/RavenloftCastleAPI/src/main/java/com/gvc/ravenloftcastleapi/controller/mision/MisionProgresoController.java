package com.gvc.ravenloftcastleapi.controller.mision;

import com.gvc.ravenloftcastleapi.dto.mision.MisionProgresoResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionProgresoSaveDTO;
import com.gvc.ravenloftcastleapi.service.MisionProgresoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/misiones/{misionId}/progresos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MisionProgresoController {

    private final MisionProgresoService misionProgresoService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping("/autosave")
    public ResponseEntity<MisionProgresoResponseDTO> guardarAutosave(
            @PathVariable Long misionId,
            @Valid @RequestBody MisionProgresoSaveDTO dto
    ) {
        return ResponseEntity.ok(misionProgresoService.guardarAutosave(getCurrentUserEmail(), misionId, dto));
    }

    @PostMapping("/manual")
    public ResponseEntity<MisionProgresoResponseDTO> crearGuardadoManual(
            @PathVariable Long misionId,
            @Valid @RequestBody MisionProgresoSaveDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(misionProgresoService.crearGuardadoManual(getCurrentUserEmail(), misionId, dto));
    }

    @GetMapping("/actual")
    public ResponseEntity<MisionProgresoResponseDTO> getActual(
            @PathVariable Long misionId,
            @RequestParam Long personajeId
    ) {
        return ResponseEntity.ok(misionProgresoService.getActual(getCurrentUserEmail(), misionId, personajeId));
    }

    @GetMapping("/manuales")
    public ResponseEntity<List<MisionProgresoResponseDTO>> listarManuales(
            @PathVariable Long misionId,
            @RequestParam Long personajeId
    ) {
        return ResponseEntity.ok(misionProgresoService.listarManuales(getCurrentUserEmail(), misionId, personajeId));
    }

    @GetMapping("/{progresoId}")
    public ResponseEntity<MisionProgresoResponseDTO> getById(
            @PathVariable Long misionId,
            @PathVariable Long progresoId
    ) {
        return ResponseEntity.ok(misionProgresoService.getById(getCurrentUserEmail(), misionId, progresoId));
    }

    @PutMapping("/{progresoId}")
    public ResponseEntity<MisionProgresoResponseDTO> actualizar(
            @PathVariable Long misionId,
            @PathVariable Long progresoId,
            @Valid @RequestBody MisionProgresoSaveDTO dto
    ) {
        return ResponseEntity.ok(misionProgresoService.actualizarGuardado(getCurrentUserEmail(), misionId, progresoId, dto));
    }

    @DeleteMapping("/{progresoId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long misionId,
            @PathVariable Long progresoId
    ) {
        misionProgresoService.eliminarGuardado(getCurrentUserEmail(), misionId, progresoId);
        return ResponseEntity.noContent().build();
    }
}

