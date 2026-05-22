package com.gvc.ravenloftcastleapi.controller.mision;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteUpdateDTO;
import com.gvc.ravenloftcastleapi.service.MisionParticipanteService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/misiones/{misionId}/participantes")
@RequiredArgsConstructor
public class MisionParticipanteController {

    private final MisionParticipanteService misionParticipanteService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    public ResponseEntity<MisionParticipanteResponseDTO> create(
            @PathVariable Long misionId,
            @Valid @RequestBody MisionParticipanteCreateDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(misionParticipanteService.crear(getCurrentUserEmail(), misionId, dto));
    }

    @GetMapping
    public ResponseEntity<List<MisionParticipanteResponseDTO>> list(@PathVariable Long misionId) {
        return ResponseEntity.ok(misionParticipanteService.listarPorMision(getCurrentUserEmail(), misionId));
    }

    @GetMapping("/jugadores")
    public ResponseEntity<List<com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO>> listJugadores(@PathVariable Long misionId) {
        return ResponseEntity.ok(misionParticipanteService.listarParticipantesJugadores(getCurrentUserEmail(), misionId));
    }

    @GetMapping("/me")
    public ResponseEntity<MisionParticipanteResponseDTO> getMyParticipacion(@PathVariable Long misionId) {
        return misionParticipanteService.getMiParticipacion(getCurrentUserEmail(), misionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tiene-master")
    public ResponseEntity<java.util.Map<String, Boolean>> tieneMaster(@PathVariable Long misionId) {
        boolean tieneMaster = misionParticipanteService.tieneMaster(misionId);
        return ResponseEntity.ok(java.util.Map.of("tieneMaster", tieneMaster));
    }

    @GetMapping("/master-info")
    public ResponseEntity<java.util.Map<String, String>> getMasterInfo(@PathVariable Long misionId) {
        return misionParticipanteService.getNombreMaster(misionId)
                .map(nombre -> ResponseEntity.ok(java.util.Map.of("nombreUsuario", nombre)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{participanteId}")
    public ResponseEntity<MisionParticipanteResponseDTO> getById(
            @PathVariable Long misionId,
            @PathVariable Long participanteId
    ) {
        return ResponseEntity.ok(misionParticipanteService.getById(getCurrentUserEmail(), misionId, participanteId));
    }

    @PutMapping("/{participanteId}")
    public ResponseEntity<MisionParticipanteResponseDTO> update(
            @PathVariable Long misionId,
            @PathVariable Long participanteId,
            @Valid @RequestBody MisionParticipanteUpdateDTO dto
    ) {
        return ResponseEntity.ok(misionParticipanteService.actualizar(getCurrentUserEmail(), misionId, participanteId, dto));
    }

    @DeleteMapping("/{participanteId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long misionId,
            @PathVariable Long participanteId
    ) {
        misionParticipanteService.eliminar(getCurrentUserEmail(), misionId, participanteId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/by-personaje/{personajeId}")
    public ResponseEntity<Void> deleteByPersonaje(
            @PathVariable Long misionId,
            @PathVariable Long personajeId
    ) {
        misionParticipanteService.eliminarPorPersonaje(getCurrentUserEmail(), misionId, personajeId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll(@PathVariable Long misionId) {
        misionParticipanteService.eliminarTodos(getCurrentUserEmail(), misionId);
        return ResponseEntity.noContent().build();
    }
}

