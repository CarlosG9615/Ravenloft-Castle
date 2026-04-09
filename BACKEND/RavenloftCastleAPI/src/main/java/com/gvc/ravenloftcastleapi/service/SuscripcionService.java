package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.suscripcion.SuscripcionCreateDTO;
import com.gvc.ravenloftcastleapi.dto.suscripcion.SuscripcionDTO;
import com.gvc.ravenloftcastleapi.dto.suscripcion.SuscripcionUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Suscripcion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.exception.SuscripcionNotFoundException;
import com.gvc.ravenloftcastleapi.exception.UserNotFoundException;
import com.gvc.ravenloftcastleapi.repository.SuscripcionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuscripcionService {

    private final SuscripcionRepository suscripcionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<SuscripcionDTO> getAllSuscripciones() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        List<Suscripcion> suscripciones;
        if (isAdmin) {
            suscripciones = suscripcionRepository.findAll();
        } else {
            suscripciones = suscripcionRepository.findByUsuario_Email(currentEmail);
        }

        return suscripciones.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SuscripcionDTO> getSuscripcionesByUsuarioId(Long usuarioId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + usuarioId));

        if (!isAdmin && !usuario.getEmail().equals(currentEmail)) {
            throw new AccessDeniedException("No tienes permiso para ver las suscripciones de este usuario.");
        }

        return suscripcionRepository.findByUsuarioId(usuarioId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SuscripcionDTO getSuscripcionById(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        Suscripcion suscripcion = suscripcionRepository.findById(id)
                .orElseThrow(() -> new SuscripcionNotFoundException("Suscripción no encontrada con id: " + id));

        if (!isAdmin && !suscripcion.getUsuario().getEmail().equals(currentEmail)) {
            throw new AccessDeniedException("No tienes permiso para ver esta suscripción.");
        }

        return mapToDTO(suscripcion);
    }

    @Transactional
    public SuscripcionDTO createSuscripcion(SuscripcionCreateDTO createDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Usuario usuario = usuarioRepository.findById(createDTO.getUsuarioId())
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + createDTO.getUsuarioId()));

        if (!isAdmin && !usuario.getEmail().equals(currentEmail)) {
            throw new AccessDeniedException("No tienes permisos para crear suscripciones para otros usuarios.");
        }

        List<Suscripcion> suscripciones = suscripcionRepository.findByUsuarioId(usuario.getId());
        boolean hasActive = suscripciones.stream().anyMatch(s -> "ACTIVA".equalsIgnoreCase(s.getEstado()));
        if (hasActive) {
            throw new IllegalArgumentException("Ya posees una suscripción activa. Debes darla de baja antes de adquirir otra.");
        }

        Suscripcion suscripcion = Suscripcion.builder()
                .usuario(usuario)
                .nombre(createDTO.getNombre())
                .tipo(createDTO.getTipo())
                .estado("ACTIVA")
                .fechaAlta(LocalDate.now())
                .build();

        return mapToDTO(suscripcionRepository.save(suscripcion));
    }

    @Transactional
    public void cancelarSuscripcion(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Suscripcion suscripcion = suscripcionRepository.findById(id)
                .orElseThrow(() -> new SuscripcionNotFoundException("Suscripción no encontrada con id: " + id));

        // Permitir cancelar si es ADMIN o si es el dueño de la suscripción
        if (!isAdmin && !suscripcion.getUsuario().getEmail().equals(currentEmail)) {
            throw new AccessDeniedException("No tienes permiso para cancelar esta suscripción.");
        }

        suscripcion.setEstado("CANCELADA");
        suscripcion.setFechaBaja(LocalDate.now());
        suscripcionRepository.save(suscripcion);
    }

    @Transactional
    public SuscripcionDTO updateSuscripcion(Long id, SuscripcionUpdateDTO updateDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Suscripcion suscripcion = suscripcionRepository.findById(id)
                .orElseThrow(() -> new SuscripcionNotFoundException("Suscripción no encontrada con id: " + id));

        if (!isAdmin && !suscripcion.getUsuario().getEmail().equals(currentEmail)) {
            throw new AccessDeniedException("No tienes permiso para modificar esta suscripción.");
        }

        if (updateDTO.getTipo() != null) {
            suscripcion.setTipo(updateDTO.getTipo());
        }

        if (updateDTO.getEstado() != null) {
            if ("ACTIVA".equalsIgnoreCase(updateDTO.getEstado())) {
                suscripcion.setEstado("ACTIVA");
                suscripcion.setFechaBaja(null);
            } else {
                suscripcion.setEstado(updateDTO.getEstado());
                if (suscripcion.getFechaBaja() == null) {
                     suscripcion.setFechaBaja(LocalDate.now());
                }
            }
        }

        return mapToDTO(suscripcionRepository.save(suscripcion));
    }

    private SuscripcionDTO mapToDTO(Suscripcion suscripcion) {
        SuscripcionDTO.SuscripcionDTOBuilder builder = SuscripcionDTO.builder()
                .id(suscripcion.getId())
                .usuarioId(suscripcion.getUsuario().getId())
                .nombre(suscripcion.getNombre())
                .tipo(suscripcion.getTipo())
                .estado(suscripcion.getEstado())
                .fechaAlta(suscripcion.getFechaAlta());

        if (!"ACTIVA".equalsIgnoreCase(suscripcion.getEstado())) {
            builder.fechaBaja(suscripcion.getFechaBaja());
        }

        return builder.build();
    }
}
