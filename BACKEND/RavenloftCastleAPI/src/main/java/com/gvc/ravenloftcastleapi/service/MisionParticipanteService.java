package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.enums.RolParticipante;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import com.gvc.ravenloftcastleapi.repository.CampanaPersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.SuscripcionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MisionParticipanteService {

    private final MisionParticipanteRepository participanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final MisionRepository misionRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final PersonajeRepository personajeRepository;
    private final CampanaPersonajeRepository campanaPersonajeRepository;

    @Transactional
    public MisionParticipanteResponseDTO crear(String email, Long misionId, MisionParticipanteCreateDTO dto) {
        Usuario currentUser = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);

        Long usuarioObjetivoId = resolveUsuarioObjetivoId(currentUser, dto.usuarioId());
        Usuario usuarioObjetivo = getUsuarioById(usuarioObjetivoId);

        validarSuscripcionActiva(usuarioObjetivoId, mision.getCampana());
        validarNoDuplicado(misionId, usuarioObjetivoId, null);

        Personaje personaje = resolvePersonajeParaRol(
                dto.rol(),
                dto.personajeId(),
                usuarioObjetivoId,
                mision.getCampana().getId()
        );

        MisionParticipante participante = MisionParticipante.builder()
                .mision(mision)
                .usuario(usuarioObjetivo)
                .personaje(personaje)
                .rol(dto.rol())
                .fechaInicio(LocalDateTime.now())
                .build();

        return toResponse(participanteRepository.save(participante));
    }

    @Transactional(readOnly = true)
    public List<MisionParticipanteResponseDTO> listarPorMision(String email, Long misionId) {
        Usuario currentUser = getUsuarioByEmail(email);
        validarLecturaMision(misionId, currentUser);

        return participanteRepository.findByMisionId(misionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MisionParticipanteResponseDTO getById(String email, Long misionId, Long participanteId) {
        Usuario currentUser = getUsuarioByEmail(email);
        validarLecturaMision(misionId, currentUser);

        MisionParticipante participante = getParticipanteByIdAndMisionId(participanteId, misionId);
        return toResponse(participante);
    }

    @Transactional
    public MisionParticipanteResponseDTO actualizar(String email, Long misionId, Long participanteId, MisionParticipanteUpdateDTO dto) {
        Usuario currentUser = getUsuarioByEmail(email);
        MisionParticipante participante = getParticipanteByIdAndMisionId(participanteId, misionId);

        validarGestionParticipante(participante, currentUser);
        validarNoDuplicado(misionId, participante.getUsuario().getId(), participante.getId());

        Personaje personaje = resolvePersonajeParaRol(
                dto.rol(),
                dto.personajeId(),
                participante.getUsuario().getId(),
                participante.getMision().getCampana().getId()
        );

        participante.setRol(dto.rol());
        participante.setPersonaje(personaje);

        return toResponse(participanteRepository.save(participante));
    }

    @Transactional
    public void eliminar(String email, Long misionId, Long participanteId) {
        Usuario currentUser = getUsuarioByEmail(email);
        MisionParticipante participante = getParticipanteByIdAndMisionId(participanteId, misionId);

        validarGestionParticipante(participante, currentUser);
        participanteRepository.delete(participante);
    }

    @Transactional(readOnly = true)
    public boolean puedeAccederAMision(Long usuarioId, Long misionId) {
        List<MisionParticipante> lista = participanteRepository.findByMisionId(misionId);
        return lista.stream().anyMatch(p -> p.getUsuario().getId().equals(usuarioId)
                && (p.getRol() == RolParticipante.JUGADOR || p.getRol() == RolParticipante.MASTER));
    }

    @Transactional(readOnly = true)
    public List<MisionParticipanteResponseDTO> findByUsuario(Long usuarioId) {
        return participanteRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private Usuario getUsuarioById(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private Mision getMisionById(Long misionId) {
        return misionRepository.findById(misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mision no encontrada"));
    }

    private MisionParticipante getParticipanteByIdAndMisionId(Long participanteId, Long misionId) {
        return participanteRepository.findByIdAndMisionId(participanteId, misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participante no encontrado en la mision"));
    }

    private Long resolveUsuarioObjetivoId(Usuario currentUser, Long usuarioIdRequest) {
        if (usuarioIdRequest == null) {
            return currentUser.getId();
        }

        if (!isAdmin(currentUser) && !currentUser.getId().equals(usuarioIdRequest)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes crear participaciones para otros usuarios");
        }

        return usuarioIdRequest;
    }

    private void validarSuscripcionActiva(Long usuarioId, Campana campana) {
        TipoSuscripcion nivel = campana.getNivelAcceso();
        boolean tieneSuscripcion = suscripcionRepository.existsByUsuarioIdAndTipoAndEstado(usuarioId, nivel, "ACTIVA");

        if (!tieneSuscripcion) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sin suscripcion activa para esta campana");
        }
    }

    private void validarNoDuplicado(Long misionId, Long usuarioId, Long participanteIdExcluido) {
        boolean yaExiste = participanteIdExcluido == null
                ? participanteRepository.existsByMisionIdAndUsuarioId(misionId, usuarioId)
                : participanteRepository.existsByMisionIdAndUsuarioIdAndIdNot(misionId, usuarioId, participanteIdExcluido);

        if (yaExiste) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario ya participa en esta mision");
        }
    }

    private Personaje resolvePersonajeParaRol(RolParticipante rol, Long personajeId, Long usuarioId, Long campanaId) {
        if (rol == RolParticipante.MASTER) {
            if (personajeId != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol MASTER no debe asociar personaje");
            }
            return null;
        }

        if (personajeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol JUGADOR requiere personajeId");
        }

        Personaje personaje = personajeRepository.findByIdAndUsuarioId(personajeId, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado para el usuario"));

        boolean unidoEnCampana = campanaPersonajeRepository.existsByCampanaIdAndPersonajeId(campanaId, personajeId);
        if (!unidoEnCampana) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El personaje no esta unido a la campana de la mision");
        }

        return personaje;
    }

    private void validarLecturaMision(Long misionId, Usuario currentUser) {
        if (!isAdmin(currentUser) && !participanteRepository.existsByMisionIdAndUsuarioId(misionId, currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No participas en esta mision");
        }
    }

    private void validarGestionParticipante(MisionParticipante participante, Usuario currentUser) {
        if (!isAdmin(currentUser) && !participante.getUsuario().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes gestionar la participacion de otro usuario");
        }
    }

    private boolean isAdmin(Usuario user) {
        if (user.getRole() == null || user.getRole().getNombre() == null) {
            return false;
        }
        String role = user.getRole().getNombre().toUpperCase().replace("ROLE_", "");
        return "ADMIN".equals(role);
    }

    private MisionParticipanteResponseDTO toResponse(MisionParticipante participante) {
        return new MisionParticipanteResponseDTO(
                participante.getId(),
                participante.getMision().getId(),
                participante.getUsuario().getId(),
                participante.getUsuario().getNombre(),
                participante.getRol().name(),
                participante.getPersonaje() != null ? participante.getPersonaje().getId() : null,
                participante.getPersonaje() != null ? participante.getPersonaje().getNombre() : null,
                participante.getFechaInicio() != null ? participante.getFechaInicio().toString() : null
        );
    }
}
