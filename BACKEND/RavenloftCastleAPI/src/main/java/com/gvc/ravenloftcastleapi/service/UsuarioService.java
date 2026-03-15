package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioResponseDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Role;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.exception.UserNotFoundException;
import com.gvc.ravenloftcastleapi.repository.RoleRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioResponseDTO getUsuarioById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + id));

        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRole().getNombre()
        );
    }

    public UsuarioResponseDTO updateUsuario(Long id, UsuarioUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + id));

        if (dto.nombre() != null && !dto.nombre().isBlank()) {
            usuario.setNombre(dto.nombre());
        }

        if (dto.email() != null && !dto.email().isBlank()) {
            if (!usuario.getEmail().equals(dto.email()) && usuarioRepository.existsByEmail(dto.email())) {
                throw new RuntimeException("El email ya está en uso");
            }
            usuario.setEmail(dto.email());
        }

        if (dto.password() != null && !dto.password().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.password()));
        }

        Usuario guardado = usuarioRepository.save(usuario);

        return new UsuarioResponseDTO(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getEmail(),
                guardado.getRole().getNombre()
        );
    }

    public void deleteUsuario(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new UserNotFoundException("Usuario no encontrado con id: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    public List<UsuarioResponseDTO> getAllUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(u -> new UsuarioResponseDTO(
                        u.getId(),
                        u.getNombre(),
                        u.getEmail(),
                        u.getRole().getNombre()
                ))
                .toList();
    }

    public UsuarioResponseDTO updateUsuarioRole(Long id, String nombreRol) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + id));

        Role rol = roleRepository.findByNombre(nombreRol.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + nombreRol));

        usuario.setRole(rol);
        Usuario guardado = usuarioRepository.save(usuario);

        return new UsuarioResponseDTO(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getEmail(),
                guardado.getRole().getNombre()
        );
    }
}
