package com.gvc.ravenloftcastleapi.controller.personaje;

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

import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeCreacionConfigDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeCreateDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.service.PersonajeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/personajes")
@RequiredArgsConstructor
public class PersonajeController {

    private final PersonajeService personajeService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<PersonajeResponseDTO>> list() {
        return ResponseEntity.ok(personajeService.listByUserEmail(getCurrentUserEmail()));
    }

    @GetMapping("/configuracion-creacion")
    public ResponseEntity<PersonajeCreacionConfigDTO> getCreationConfig() {
        return ResponseEntity.ok(personajeService.getCreationConfig());
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PersonajeResponseDTO>> listByUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(personajeService.listByUsuarioIdForCurrentUser(getCurrentUserEmail(), usuarioId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonajeResponseDTO> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(personajeService.getOneByUserEmail(getCurrentUserEmail(), id));
    }

    @PostMapping
    public ResponseEntity<PersonajeResponseDTO> create(@Valid @RequestBody PersonajeCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(personajeService.createForUserEmail(getCurrentUserEmail(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonajeResponseDTO> update(@PathVariable Long id, @Valid @RequestBody PersonajeCreateDTO dto) {
        return ResponseEntity.ok(personajeService.updateForUserEmail(getCurrentUserEmail(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        personajeService.deleteForUserEmail(getCurrentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }
}
