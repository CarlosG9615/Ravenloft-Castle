package com.gvc.ravenloftcastleapi.controller;

import com.gvc.ravenloftcastleapi.dto.PerfilPublicoDTO;
import com.gvc.ravenloftcastleapi.dto.SeguimientoDTO;
import com.gvc.ravenloftcastleapi.service.SeguimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seguimiento")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SeguimientoController {

    private final SeguimientoService seguimientoService;

    @PostMapping("/{usuarioId}/seguir")
    public ResponseEntity<Void> seguir(@PathVariable Long usuarioId) {
        seguimientoService.seguir(usuarioId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{usuarioId}/dejar-de-seguir")
    public ResponseEntity<Void> dejarDeSeguir(@PathVariable Long usuarioId) {
        seguimientoService.dejarDeSeguir(usuarioId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{usuarioId}/seguidores")
    public ResponseEntity<List<SeguimientoDTO>> getSeguidores(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(seguimientoService.getSeguidores(usuarioId));
    }

    @GetMapping("/{usuarioId}/siguiendo")
    public ResponseEntity<List<SeguimientoDTO>> getSiguiendo(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(seguimientoService.getSiguiendo(usuarioId));
    }

    @GetMapping("/{usuarioId}/perfil")
    public ResponseEntity<PerfilPublicoDTO> getPerfilPublico(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(seguimientoService.getPerfilPublico(usuarioId));
    }

    @GetMapping("/por-personaje/{personajeId}/perfil")
    public ResponseEntity<PerfilPublicoDTO> getPerfilPorPersonaje(@PathVariable Long personajeId) {
        return ResponseEntity.ok(seguimientoService.getPerfilPorPersonaje(personajeId));
    }
}
