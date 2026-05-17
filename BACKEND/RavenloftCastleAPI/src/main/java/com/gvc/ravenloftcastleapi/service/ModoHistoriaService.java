package com.gvc.ravenloftcastleapi.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoResumenDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.ModoHistoriaEnemigoDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionResumenDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaCreateDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaEnemigoResponseDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaEnemigoUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.entity.Enemigo;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import com.gvc.ravenloftcastleapi.entity.ModoHistoria;
import com.gvc.ravenloftcastleapi.entity.ModoHistoriaEnemigo;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.enums.RolParticipante;
import com.gvc.ravenloftcastleapi.repository.EnemigoRepository;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.ModoHistoriaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ModoHistoriaService {

    private final ModoHistoriaRepository modoHistoriaRepository;
    private final EnemigoRepository enemigoRepository;
    private final MisionParticipanteRepository misionParticipanteRepository;

    @Transactional
    public ModoHistoriaDetalleDTO crearModoHistoria(ModoHistoriaCreateDTO dto) {
        String codigoGenerado = UUID.randomUUID().toString();

        ModoHistoria nuevaModoHistoria = ModoHistoria.builder()
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

        ModoHistoria modoHistoriaGuardada = modoHistoriaRepository.save(nuevaModoHistoria);
        return mapToDetalleDTO(modoHistoriaGuardada);
    }

    @Transactional(readOnly = true)
    public ModoHistoriaDetalleDTO obtenerModoHistoriaPorId(Long id) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada"));
        return mapToDetalleDTO(modoHistoria);
    }

    @Transactional(readOnly = true)
    public List<ModoHistoriaDetalleDTO> listarModoHistoriasPublicas() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        List<ModoHistoria> modoHistorias = modoHistoriaRepository.findAll();
        return modoHistorias.stream()
                .filter(modoHistoria -> isAdmin || modoHistoria.isActive())
                .map(this::mapToDetalleDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public String actualizarCodigoInvitacion(Long modoHistoriaId, String nuevoCodigo) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(modoHistoriaId)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada"));

        // Validar si el cÃ³digo ya existe
        if (modoHistoriaRepository.existsByCodigoInvitacion(nuevoCodigo)) {
            throw new RuntimeException("El cÃ³digo de invitaciÃ³n ya estÃ¡ en uso");
        }

        modoHistoria.setCodigoInvitacion(nuevoCodigo);
        modoHistoriaRepository.save(modoHistoria);
        return nuevoCodigo;
    }

    @Transactional
    public ModoHistoriaDetalleDTO actualizarModoHistoria(Long id, ModoHistoriaUpdateDTO dto) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada con id: " + id));

        if (dto.getNombre() != null) modoHistoria.setNombre(dto.getNombre());
        if (dto.getDescripcion() != null) modoHistoria.setDescripcion(dto.getDescripcion());
        if (dto.getDificultad() != null) modoHistoria.setDificultad(dto.getDificultad());
        if (dto.getNivelMinimo() != null) modoHistoria.setNivelMinimo(dto.getNivelMinimo());
        if (dto.getMaxJugadores() != null) modoHistoria.setMaxJugadores(dto.getMaxJugadores());
        if (dto.getSistema() != null) modoHistoria.setSistema(dto.getSistema());
        if (dto.getActive() != null) modoHistoria.setActive(dto.getActive());
        if (dto.getNivelAcceso() != null) modoHistoria.setNivelAcceso(dto.getNivelAcceso());

        ModoHistoria modoHistoriaActualizada = modoHistoriaRepository.save(modoHistoria);
        return mapToDetalleDTO(modoHistoriaActualizada);
    }

    @Transactional
    public void eliminarModoHistoria(Long id) {
        if (!modoHistoriaRepository.existsById(id)) {
            throw new RuntimeException("CampaÃ±a no encontrada con id: " + id);
        }
        modoHistoriaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PersonajeResponseDTO> listarJugadoresDeModoHistoria(Long modoHistoriaId) {
        return misionParticipanteRepository
                .findPersonajesActivosByModoHistoriaId(modoHistoriaId)
                .stream()
                .map(this::mapToPersonajeDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MisionResumenDTO> listarMisionesDeModoHistoria(Long modoHistoriaId) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(modoHistoriaId)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada"));
        return modoHistoria.getMisiones().stream()
                .map(this::mapToMisionDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void asignarEnemigo(Long modoHistoriaId, ModoHistoriaEnemigoDTO dto) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(modoHistoriaId)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada con id: " + modoHistoriaId));

        Enemigo enemigo = enemigoRepository.findById(dto.enemigoId())
                .orElseThrow(() -> new RuntimeException("Enemigo no encontrado con id: " + dto.enemigoId()));

        if (modoHistoria.getEnemigos() == null) {
            modoHistoria.setEnemigos(new java.util.ArrayList<>());
        }

        // Check if Enemy is already assigned to the campaign, perhaps update
        Optional<ModoHistoriaEnemigo> existente = modoHistoria.getEnemigos().stream()
                .filter(ce -> ce.getEnemigo().getId().equals(enemigo.getId()) && ce.getDificultad() == dto.dificultad())
                .findFirst();

        if (existente.isPresent()) {
            existente.get().setCantidad(existente.get().getCantidad() + dto.cantidad());
        } else {
            ModoHistoriaEnemigo modoHistoriaEnemigo = new ModoHistoriaEnemigo();
            modoHistoriaEnemigo.setModoHistoria(modoHistoria);
            modoHistoriaEnemigo.setEnemigo(enemigo);
            modoHistoriaEnemigo.setCantidad(dto.cantidad());
            modoHistoriaEnemigo.setDificultad(dto.dificultad());
            modoHistoria.getEnemigos().add(modoHistoriaEnemigo);
        }

        modoHistoriaRepository.save(modoHistoria);
    }

    @Transactional
    public void editarEnemigoModoHistoria(Long modoHistoriaId, Long enemigoId, ModoHistoriaEnemigoUpdateDTO dto) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(modoHistoriaId)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada con id: " + modoHistoriaId));

        ModoHistoriaEnemigo modoHistoriaEnemigo = modoHistoria.getEnemigos().stream()
                .filter(ce -> ce.getEnemigo().getId().equals(enemigoId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("El enemigo no estÃ¡ asignado a esta campaÃ±a"));

        if (dto.cantidad() != null) {
            modoHistoriaEnemigo.setCantidad(dto.cantidad());
        }
        if (dto.dificultad() != null) {
            modoHistoriaEnemigo.setDificultad(dto.dificultad());
        }

        modoHistoriaRepository.save(modoHistoria);
    }

    @Transactional
    public void eliminarEnemigoModoHistoria(Long modoHistoriaId, Long enemigoId) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(modoHistoriaId)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada con id: " + modoHistoriaId));

        boolean remoted = modoHistoria.getEnemigos().removeIf(ce -> ce.getEnemigo().getId().equals(enemigoId));

        if (!remoted) {
            throw new RuntimeException("El enemigo no estÃ¡ asignado a esta campaÃ±a");
        }

        modoHistoriaRepository.save(modoHistoria);
    }

    @Transactional(readOnly = true)
    public List<ModoHistoriaEnemigoResponseDTO> listarEnemigosDeModoHistoria(Long modoHistoriaId) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(modoHistoriaId)
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada con id: " + modoHistoriaId));

        return Optional.ofNullable(modoHistoria.getEnemigos())
                .orElse(Collections.emptyList())
                .stream()
                .map(ce -> new ModoHistoriaEnemigoResponseDTO(
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

    private ModoHistoriaDetalleDTO mapToDetalleDTO(ModoHistoria modoHistoria) {
        List<MisionParticipante> participaciones = misionParticipanteRepository.findByMisionModoHistoriaId(modoHistoria.getId());

        int jugadoresActuales = (int) participaciones.stream()
            .filter(p -> p.getRol() == RolParticipante.JUGADOR)
            .map(p -> p.getPersonaje() != null ? p.getPersonaje().getId() : null)
            .filter(id -> id != null)
            .distinct()
            .count();

        int mastersActuales = (int) participaciones.stream()
            .filter(p -> p.getRol() == RolParticipante.MASTER)
            .map(p -> p.getUsuario() != null ? p.getUsuario().getId() : null)
            .filter(id -> id != null)
            .distinct()
            .count();

        int plazasJugadorLibres = Math.max(0, MisionParticipanteService.MAX_JUGADORES - jugadoresActuales);
        int plazasMasterLibres = Math.max(0, MisionParticipanteService.MAX_MASTERS - mastersActuales);

        return ModoHistoriaDetalleDTO.builder()
                .id(modoHistoria.getId())
                .nombre(modoHistoria.getNombre())
                .descripcion(modoHistoria.getDescripcion())
                .dificultad(modoHistoria.getDificultad())
                .nivelMinimo(modoHistoria.getNivelMinimo())
                .maxJugadores(modoHistoria.getMaxJugadores())
            .jugadoresActuales(jugadoresActuales)
            .mastersActuales(mastersActuales)
            .plazasJugadorLibres(plazasJugadorLibres)
            .plazasMasterLibres(plazasMasterLibres)
                .nivelAcceso(modoHistoria.getNivelAcceso())
                .active(modoHistoria.isActive())
                .master(null) // TODO: Implementar lÃ³gica para obtener el master
                .personajes(misionParticipanteRepository
                        .findPersonajesActivosByModoHistoriaId(modoHistoria.getId())
                        .stream()
                        .map(this::mapToPersonajeDTO)
                        .collect(Collectors.toList()))
                .misiones(Optional.ofNullable(modoHistoria.getMisiones())
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

