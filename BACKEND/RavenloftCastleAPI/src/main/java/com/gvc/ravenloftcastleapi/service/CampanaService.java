package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.campana.CampanaCreateDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaEnemigoUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaEnemigoResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionResumenDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.CampanaEnemigoDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoResumenDTO;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.entity.CampanaPersonaje;
import com.gvc.ravenloftcastleapi.entity.CampanaEnemigo;
import com.gvc.ravenloftcastleapi.entity.Enemigo;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.repository.CampanaRepository;
import com.gvc.ravenloftcastleapi.repository.EnemigoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaRepository campanaRepository;
    private final EnemigoRepository enemigoRepository;

    @Transactional
    public CampanaDetalleDTO crearCampana(CampanaCreateDTO dto) {
        String codigoGenerado = UUID.randomUUID().toString();

        Campana nuevaCampana = Campana.builder()
                .nombre(dto.getNombre())
                .descripcion(dto.getDescripcion())
                .fechaCreacion(LocalDate.now())
                .dificultad(dto.getDificultad())
                .nivelMinimo(dto.getNivelMinimo())
                .maxJugadores(dto.getMaxJugadores())
                .sistema(dto.getSistema())
                .active(dto.isActive())
                .nivelAcceso(dto.getNivelAcceso())
                .codigoInvitacion(codigoGenerado)
                .build();

        Campana campanaGuardada = campanaRepository.save(nuevaCampana);
        return mapToDetalleDTO(campanaGuardada);
    }

    @Transactional(readOnly = true)
    public CampanaDetalleDTO obtenerCampanaPorId(Long id) {
        Campana campana = campanaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
        return mapToDetalleDTO(campana);
    }

    @Transactional(readOnly = true)
    public List<CampanaDetalleDTO> listarCampanasPublicas() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        List<Campana> campanas = campanaRepository.findAll();
        return campanas.stream()
                .filter(campana -> isAdmin || campana.isActive())
                .map(this::mapToDetalleDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public String actualizarCodigoInvitacion(Long campanaId, String nuevoCodigo) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        // Validar si el código ya existe
        if (campanaRepository.existsByCodigoInvitacion(nuevoCodigo)) {
            throw new RuntimeException("El código de invitación ya está en uso");
        }

        campana.setCodigoInvitacion(nuevoCodigo);
        campanaRepository.save(campana);
        return nuevoCodigo;
    }

    @Transactional
    public CampanaDetalleDTO actualizarCampana(Long id, CampanaUpdateDTO dto) {
        Campana campana = campanaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con id: " + id));

        if (dto.getNombre() != null) campana.setNombre(dto.getNombre());
        if (dto.getDescripcion() != null) campana.setDescripcion(dto.getDescripcion());
        if (dto.getDificultad() != null) campana.setDificultad(dto.getDificultad());
        if (dto.getNivelMinimo() != null) campana.setNivelMinimo(dto.getNivelMinimo());
        if (dto.getMaxJugadores() != null) campana.setMaxJugadores(dto.getMaxJugadores());
        if (dto.getSistema() != null) campana.setSistema(dto.getSistema());
        if (dto.getActive() != null) campana.setActive(dto.getActive());
        if (dto.getNivelAcceso() != null) campana.setNivelAcceso(dto.getNivelAcceso());

        Campana campanaActualizada = campanaRepository.save(campana);
        return mapToDetalleDTO(campanaActualizada);
    }

    @Transactional
    public void eliminarCampana(Long id) {
        if (!campanaRepository.existsById(id)) {
            throw new RuntimeException("Campaña no encontrada con id: " + id);
        }
        campanaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PersonajeResponseDTO> listarJugadoresDeCampana(Long campanaId) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con id: " + campanaId));

        return Optional.ofNullable(campana.getPersonajes())
                .orElse(Collections.emptyList())
                .stream()
                .map(CampanaPersonaje::getPersonaje)
                .map(this::mapToPersonajeDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MisionResumenDTO> listarMisionesDeCampana(Long campanaId) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
        return campana.getMisiones().stream()
                .map(this::mapToMisionDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void asignarEnemigo(Long campanaId, CampanaEnemigoDTO dto) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con id: " + campanaId));

        Enemigo enemigo = enemigoRepository.findById(dto.enemigoId())
                .orElseThrow(() -> new RuntimeException("Enemigo no encontrado con id: " + dto.enemigoId()));

        if (campana.getEnemigos() == null) {
            campana.setEnemigos(new java.util.ArrayList<>());
        }

        // Check if Enemy is already assigned to the campaign, perhaps update
        Optional<CampanaEnemigo> existente = campana.getEnemigos().stream()
                .filter(ce -> ce.getEnemigo().getId().equals(enemigo.getId()) && ce.getDificultad() == dto.dificultad())
                .findFirst();

        if (existente.isPresent()) {
            existente.get().setCantidad(existente.get().getCantidad() + dto.cantidad());
        } else {
            CampanaEnemigo campanaEnemigo = new CampanaEnemigo();
            campanaEnemigo.setCampana(campana);
            campanaEnemigo.setEnemigo(enemigo);
            campanaEnemigo.setCantidad(dto.cantidad());
            campanaEnemigo.setDificultad(dto.dificultad());
            campana.getEnemigos().add(campanaEnemigo);
        }

        campanaRepository.save(campana);
    }

    @Transactional
    public void editarEnemigoCampana(Long campanaId, Long enemigoId, CampanaEnemigoUpdateDTO dto) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con id: " + campanaId));

        CampanaEnemigo campanaEnemigo = campana.getEnemigos().stream()
                .filter(ce -> ce.getEnemigo().getId().equals(enemigoId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("El enemigo no está asignado a esta campaña"));

        if (dto.cantidad() != null) {
            campanaEnemigo.setCantidad(dto.cantidad());
        }
        if (dto.dificultad() != null) {
            campanaEnemigo.setDificultad(dto.dificultad());
        }

        campanaRepository.save(campana);
    }

    @Transactional
    public void eliminarEnemigoCampana(Long campanaId, Long enemigoId) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con id: " + campanaId));

        boolean remoted = campana.getEnemigos().removeIf(ce -> ce.getEnemigo().getId().equals(enemigoId));

        if (!remoted) {
            throw new RuntimeException("El enemigo no está asignado a esta campaña");
        }

        campanaRepository.save(campana);
    }

    @Transactional(readOnly = true)
    public List<CampanaEnemigoResponseDTO> listarEnemigosDeCampana(Long campanaId) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con id: " + campanaId));

        return Optional.ofNullable(campana.getEnemigos())
                .orElse(Collections.emptyList())
                .stream()
                .map(ce -> new CampanaEnemigoResponseDTO(
                        ce.getId(),
                        new EnemigoResumenDTO(
                                ce.getEnemigo().getId(),
                                ce.getEnemigo().getNombre(),
                                ce.getEnemigo().getTipo(),
                                ce.getEnemigo().getCr().doubleValue(),
                                ce.getEnemigo().getSalud(),
                                ce.getEnemigo().getCa()
                        ),
                        ce.getCantidad(),
                        ce.getDificultad()
                ))
                .collect(Collectors.toList());
    }

    private CampanaDetalleDTO mapToDetalleDTO(Campana campana) {
        return CampanaDetalleDTO.builder()
                .id(campana.getId())
                .nombre(campana.getNombre())
                .descripcion(campana.getDescripcion())
                .dificultad(campana.getDificultad())
                .nivelMinimo(campana.getNivelMinimo())
                .maxJugadores(campana.getMaxJugadores())
                .active(campana.isActive())
                .master(null) // TODO: Implementar lógica para obtener el master
                .personajes(Optional.ofNullable(campana.getPersonajes())
                        .orElse(Collections.emptyList())
                        .stream()
                        .map(CampanaPersonaje::getPersonaje)
                        .map(this::mapToPersonajeDTO)
                        .collect(Collectors.toList()))
                .misiones(Optional.ofNullable(campana.getMisiones())
                        .orElse(Collections.emptyList())
                        .stream()
                        .map(this::mapToMisionDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    private PersonajeResponseDTO mapToPersonajeDTO(Personaje personaje) {
        return PersonajeResponseDTO.builder()
                .id(personaje.getId())
                .usuarioId(personaje.getUsuario() != null ? personaje.getUsuario().getId() : null)
                .usuarioNombre(personaje.getUsuario() != null ? personaje.getUsuario().getNombre() : "Desconocido")
                .nombre(personaje.getNombre())
                .clase(personaje.getClase() != null ? personaje.getClase().getNombre() : "Sin Clase")
                .raza(personaje.getRaza() != null ? personaje.getRaza().getNombre() : "Sin Raza")
                .nivel(personaje.getNivel())
                .fuerza(personaje.getFuerza())
                .destreza(personaje.getDestreza())
                .avatar(personaje.getAvatar())
                .build();
    }

    private MisionResumenDTO mapToMisionDTO(Mision mision) {
        return new MisionResumenDTO(
                mision.getId(),
                mision.getNombre(),
                mision.getDescripcion(),
                mision.getOrden(),
                mision.getDificultad(),
                mision.getXpRecompensa(),
                mision.isCompletada()
        );
    }
}
