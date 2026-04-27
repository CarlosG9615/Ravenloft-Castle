package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.CampanaRequest;
import com.gvc.ravenloftcastleapi.dto.CampanaResponse;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.CampanaRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaRepository campanaRepository;
    private final UsuarioRepository usuarioRepository;

    public CampanaResponse crearCampana(CampanaRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario master = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Campana campana = Campana.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .active(true)
                .codigoInvitacion(UUID.randomUUID().toString().substring(0, 8)) // short random code
                .fechaCreacion(LocalDate.now())
                .maxJugadores(10)
                .sistema("D&D 5e")
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
                .logo(campana.getLogo())
                .imagen(campana.getImagen())
                .masterId(campana.getMaster().getId())
                .masterNombre(campana.getMaster().getNombre())
                .maxJugadores(campana.getMaxJugadores())
                .sistema(campana.getSistema())
                .active(campana.getActive())
                .build();
    }
}