package com.gvc.ravenloftcastleapi.controller.usuario;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioResponseDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioRolUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioUpdateDTO;
import com.gvc.ravenloftcastleapi.service.UsuarioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> obtenerUsuarioPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerUsuarioPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> actualizarUsuario(@PathVariable Long id, @RequestBody UsuarioUpdateDTO usuarioUpdateDTO) {
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, usuarioUpdateDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/rol")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponseDTO> cambiarRol(@PathVariable Long id, @RequestBody UsuarioRolUpdateDTO dto) {
        if (dto.rol() == null || dto.rol().isBlank()) {
            throw new IllegalArgumentException("Se requiere el campo 'rol'");
        }
        return ResponseEntity.ok(usuarioService.cambiarRolUsuario(id, dto.rol()));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> obtenerMiPerfil() {
        return ResponseEntity.ok(usuarioService.obtenerMiPerfil());
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> actualizarMiPerfil(@RequestBody UsuarioUpdateDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizarMiPerfil(dto));
    }

}
