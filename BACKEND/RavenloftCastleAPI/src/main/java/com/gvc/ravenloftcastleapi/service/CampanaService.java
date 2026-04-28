package com.gvc.ravenloftcastleapi.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

@Service
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaRepository campanaRepository;
    private final UsuarioRepository usuarioRepository;

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
                .codigoInvitacion(UUID.randomUUID().toString().substring(0, 8)) // short random code
            .active(active == null || active)
            .maxJugadores(maxJugadores)
            .numSesiones(numSesiones)
                .sistema(request.getSistema() != null ? request.getSistema() : "D&D 5e")
                .dificultad(request.getDificultad())
                .mapasSeleccionados(request.getMapasSeleccionados())
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

    public void eliminarCampana(Long id) {
        campanaRepository.deleteById(id);
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
                .mapasSeleccionados(campana.getMapasSeleccionados())
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