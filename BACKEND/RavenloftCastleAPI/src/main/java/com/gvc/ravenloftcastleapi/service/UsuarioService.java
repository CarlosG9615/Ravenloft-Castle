package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioResponseDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Role;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.exception.UserNotFoundException;
import com.gvc.ravenloftcastleapi.repository.RoleRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioResponseDTO obtenerUsuarioPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario con id " + id + " no encontrado"));

        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRole().getNombre()
        );
    }

    public List<UsuarioResponseDTO> listarUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(usuario -> new UsuarioResponseDTO(
                        usuario.getId(),
                        usuario.getNombre(),
                        usuario.getEmail(),
                        usuario.getRole().getNombre()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioResponseDTO actualizarUsuario(Long id, UsuarioUpdateDTO updateDTO) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario con id " + id + " no encontrado"));

        validarPermisosEdicion(usuario);

        if (updateDTO.nombre() != null && !updateDTO.nombre().isBlank()) {
            usuario.setNombre(updateDTO.nombre());
        }

        if (updateDTO.email() != null && !updateDTO.email().isBlank() && !updateDTO.email().equals(usuario.getEmail())) {
            if (usuarioRepository.existsByEmail(updateDTO.email())) {
                throw new IllegalArgumentException("El email ya está en uso");
            }
            usuario.setEmail(updateDTO.email());
        }

        if (updateDTO.password() != null && !updateDTO.password().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(updateDTO.password()));
        }

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        return new UsuarioResponseDTO(
                usuarioGuardado.getId(),
                usuarioGuardado.getNombre(),
                usuarioGuardado.getEmail(),
                usuarioGuardado.getRole().getNombre()
        );
    }

    @Transactional
    public void eliminarUsuario(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new UserNotFoundException("Usuario con id " + id + " no encontrado");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            throw new AccessDeniedException("Solo los administradores pueden eliminar usuarios");
        }

        usuarioRepository.deleteById(id);
    }

    @Transactional
    public UsuarioResponseDTO cambiarRolUsuario(Long id, String nombreRol) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            throw new AccessDeniedException("Solo los administradores pueden cambiar roles");
        }

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario con id " + id + " no encontrado"));
        
        // Normalizamos el nombre del rol (asumimos que en BD estan en mayusculas, e.g. "ADMIN", "USER")
        // Si el usuario pasa "admin" -> "ADMIN". Si pasa "ROLE_ADMIN" -> "ADMIN"
        String rolBusqueda = nombreRol.toUpperCase().replace("ROLE_", "");

        Role role = roleRepository.findByNombre(rolBusqueda)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + nombreRol));
        
        usuario.setRole(role);
        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        return new UsuarioResponseDTO(
                usuarioGuardado.getId(),
                usuarioGuardado.getNombre(),
                usuarioGuardado.getEmail(),
                usuarioGuardado.getRole().getNombre()
        );
    }

    private void validarPermisosEdicion(Usuario usuarioObjetivo) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailAutenticado = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !emailAutenticado.equals(usuarioObjetivo.getEmail())) {
            throw new AccessDeniedException("No tienes permiso para editar este usuario");
        }
    }
}
