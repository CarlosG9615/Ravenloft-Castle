package com.gvc.ravenloftcastleapi.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.gvc.ravenloftcastleapi.entity.CampanaJugador;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.repository.CampanaJugadorRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.gvc.ravenloftcastleapi.dto.CampanaRequest;
import com.gvc.ravenloftcastleapi.dto.CampanaResponse;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.enums.EstadoCampana;
import com.gvc.ravenloftcastleapi.repository.CampanaRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaRepository campanaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CampanaJugadorRepository campanaJugadorRepository;
    private final NotificacionService notificacionService;

    public CampanaResponse crearCampana(CampanaRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario master = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Boolean active = request.getActive();
        Integer maxJugadores = request.getMaxJugadores();
        if (maxJugadores == null) {
            maxJugadores = 5;
        }

        Integer numSesiones = request.getNumSesiones();
        if (numSesiones == null) {
            numSesiones = 0;
        }

        Campana campana = Campana.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .codigoInvitacion(request.getCodigoInvitacion() != null && !request.getCodigoInvitacion().trim().isEmpty() ? request.getCodigoInvitacion() : UUID.randomUUID().toString().substring(0, 8))
            .active(active == null || active)
            .maxJugadores(maxJugadores)
            .numSesiones(numSesiones)
                .sistema(request.getSistema() != null ? request.getSistema() : "D&D 5e")
                .dificultad(request.getDificultad())
                .mapasSeleccionados(request.getMapas() != null ? String.join(",", request.getMapas()) : null)
                .estado(request.getEstado() != null ? EstadoCampana.fromString(request.getEstado()) : EstadoCampana.ABIERTA)
                .logo(request.getLogo())
                .imagen(request.getImagen())
                .master(master)
                .build();

        Campana saved = campanaRepository.save(campana);
        return mapToResponse(saved);
    }

    public List<CampanaResponse> obtenerMisCampanas() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario master = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return campanaRepository.findByMasterId(master.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CampanaResponse> obtenerCampanasActivas() {
        return campanaRepository.findAllByActive(true)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarCampana(Long id) {
        Campana campana = campanaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new AccessDeniedException("No tienes permiso para eliminar esta campaña");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        boolean esMaster = campana.getMaster() != null
                && authentication.getName().equals(campana.getMaster().getEmail());

        if (!isAdmin && !esMaster) {
            throw new AccessDeniedException("No tienes permiso para eliminar esta campaña");
        }

        campanaRepository.delete(campana);
    }

    public CampanaResponse obtenerCampana(Long id) {
        Campana campana = campanaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
        return mapToResponse(campana);
    }

    @Transactional
    public void unirseACampana(Long campanaId, Long personajeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario jugador = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        // Evitar duplicados
        if (campanaJugadorRepository.existsByCampanaIdAndUsuarioId(campanaId, jugador.getId())) {
            return;
        }

        Personaje personaje = null;
        if (personajeId != null) {
            personaje = new Personaje();
            personaje.setId(personajeId);
        }

        CampanaJugador union = CampanaJugador.builder()
                .campana(campana)
                .usuario(jugador)
                .personaje(personaje)
                .build();

        campanaJugadorRepository.save(union);

        // Notificar al master
        notificacionService.crearNotificacion(
                campana.getMaster().getId(),
                jugador.getId(),
                "UNION_CAMPANA",
                jugador.getNombre() + " quiere unirse a tu campaña \"" + campana.getNombre() + "\"",
                campanaId,
                campana.getNombre()
        );
    }


    private CampanaResponse mapToResponse(Campana campana) {
        return CampanaResponse.builder()
                .id(campana.getId())
                .nombre(campana.getNombre())
                .descripcion(campana.getDescripcion())
                .codigoInvitacion(campana.getCodigoInvitacion())
                .dificultad(campana.getDificultad())
                .logo(campana.getLogo())
                .imagen(campana.getImagen())
                .mapas(campana.getMapasSeleccionados() != null ? java.util.Arrays.asList(campana.getMapasSeleccionados().split(",")) : null)
                .masterId(campana.getMaster().getId())
                .masterNombre(campana.getMaster().getNombre())
                .maxJugadores(campana.getMaxJugadores())
                .numSesiones(campana.getNumSesiones())
                .sistema(campana.getSistema())
                .estado(campana.getEstado() != null ? campana.getEstado().toValue() : null)
                .active(campana.getActive())
                .build();
    }
}