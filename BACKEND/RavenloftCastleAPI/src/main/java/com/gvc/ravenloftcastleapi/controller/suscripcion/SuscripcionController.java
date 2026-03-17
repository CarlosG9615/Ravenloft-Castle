package com.gvc.ravenloftcastleapi.controller.suscripcion;

import com.gvc.ravenloftcastleapi.dto.suscripcion.SuscripcionCreateDTO;
import com.gvc.ravenloftcastleapi.dto.suscripcion.SuscripcionDTO;
import com.gvc.ravenloftcastleapi.dto.suscripcion.SuscripcionUpdateDTO;
import com.gvc.ravenloftcastleapi.service.SuscripcionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suscripciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SuscripcionController {

    private final SuscripcionService suscripcionService;

    @GetMapping
    public ResponseEntity<List<SuscripcionDTO>> getAllSuscripciones() {
        return ResponseEntity.ok(suscripcionService.getAllSuscripciones());
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<SuscripcionDTO>> getSuscripcionesByUsuarioId(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(suscripcionService.getSuscripcionesByUsuarioId(usuarioId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuscripcionDTO> getSuscripcionById(@PathVariable Long id) {
        return ResponseEntity.ok(suscripcionService.getSuscripcionById(id));
    }

    @PostMapping
    public ResponseEntity<SuscripcionDTO> createSuscripcion(@RequestBody @Valid SuscripcionCreateDTO createDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(suscripcionService.createSuscripcion(createDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SuscripcionDTO> updateSuscripcion(@PathVariable Long id, @RequestBody SuscripcionUpdateDTO updateDTO) {
        return ResponseEntity.ok(suscripcionService.updateSuscripcion(id, updateDTO));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelarSuscripcion(@PathVariable Long id) {
        suscripcionService.cancelarSuscripcion(id);
        return ResponseEntity.noContent().build();
    }
}
