package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.mision.MisionProgresoResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionProgresoSaveDTO;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.MisionEscenario;
import com.gvc.ravenloftcastleapi.entity.MisionProgreso;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.enums.TipoGuardadoProgreso;
import com.gvc.ravenloftcastleapi.repository.CampanaPersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.MisionEscenarioRepository;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.MisionProgresoRepository;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MisionProgresoService {

    private static final int NUMERO_GUARDADO_AUTOSAVE = 0;

    private final MisionProgresoRepository misionProgresoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MisionRepository misionRepository;
    private final MisionParticipanteRepository misionParticipanteRepository;
    private final PersonajeRepository personajeRepository;
    private final CampanaPersonajeRepository campanaPersonajeRepository;
    private final MisionEscenarioRepository misionEscenarioRepository;

    @Transactional
    public MisionProgresoResponseDTO guardarAutosave(String email, Long misionId, MisionProgresoSaveDTO dto) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        Personaje personaje = getPersonajeValido(usuario.getId(), mision, dto.personajeId());
        MisionEscenario escenario = getEscenarioValido(misionId, dto.misionEscenarioId());

        MisionProgreso progreso = misionProgresoRepository
                .findByMisionIdAndUsuarioIdAndPersonajeIdAndNumeroGuardado(
                        misionId,
                        usuario.getId(),
                        personaje.getId(),
                        NUMERO_GUARDADO_AUTOSAVE
                )
                .orElseGet(() -> MisionProgreso.builder()
                        .mision(mision)
                        .usuario(usuario)
                        .personaje(personaje)
                        .tipoGuardado(TipoGuardadoProgreso.AUTOSAVE)
                        .numeroGuardado(NUMERO_GUARDADO_AUTOSAVE)
                        .build());

        aplicarDatosGuardado(progreso, dto, escenario, TipoGuardadoProgreso.AUTOSAVE, NUMERO_GUARDADO_AUTOSAVE);
        return toResponse(misionProgresoRepository.save(progreso));
    }

    @Transactional
    public MisionProgresoResponseDTO crearGuardadoManual(String email, Long misionId, MisionProgresoSaveDTO dto) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        Personaje personaje = getPersonajeValido(usuario.getId(), mision, dto.personajeId());
        MisionEscenario escenario = getEscenarioValido(misionId, dto.misionEscenarioId());

        Integer siguienteNumero = misionProgresoRepository.nextNumeroGuardadoManual(
                misionId,
                usuario.getId(),
                personaje.getId(),
                TipoGuardadoProgreso.MANUAL
        );

        MisionProgreso progreso = MisionProgreso.builder()
                .mision(mision)
                .usuario(usuario)
                .personaje(personaje)
                .tipoGuardado(TipoGuardadoProgreso.MANUAL)
                .numeroGuardado(siguienteNumero)
                .build();

        aplicarDatosGuardado(progreso, dto, escenario, TipoGuardadoProgreso.MANUAL, siguienteNumero);

        if (progreso.getNombreGuardado() == null || progreso.getNombreGuardado().isBlank()) {
            progreso.setNombreGuardado("Guardado manual #" + siguienteNumero);
        }

        return toResponse(misionProgresoRepository.save(progreso));
    }

    @Transactional(readOnly = true)
    public MisionProgresoResponseDTO getActual(String email, Long misionId, Long personajeId) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        Personaje personaje = getPersonajeValido(usuario.getId(), mision, personajeId);

        return misionProgresoRepository
                .findByMisionIdAndUsuarioIdAndPersonajeIdAndNumeroGuardado(misionId, usuario.getId(), personaje.getId(), NUMERO_GUARDADO_AUTOSAVE)
                .map(this::toResponse)
                .orElseGet(() -> misionProgresoRepository
                        .findFirstByMisionIdAndUsuarioIdAndPersonajeIdAndTipoGuardadoOrderByActualizadoEnDesc(
                                misionId,
                                usuario.getId(),
                                personaje.getId(),
                                TipoGuardadoProgreso.MANUAL
                        )
                        .map(this::toResponse)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe progreso guardado para esta misión y personaje"))
                );
    }

    @Transactional(readOnly = true)
    public List<MisionProgresoResponseDTO> listarManuales(String email, Long misionId, Long personajeId) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        Personaje personaje = getPersonajeValido(usuario.getId(), mision, personajeId);

        return misionProgresoRepository
                .findByMisionIdAndUsuarioIdAndPersonajeIdAndTipoGuardadoOrderByNumeroGuardadoDesc(
                        misionId,
                        usuario.getId(),
                        personaje.getId(),
                        TipoGuardadoProgreso.MANUAL
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MisionProgresoResponseDTO getById(String email, Long misionId, Long progresoId) {
        Usuario usuario = getUsuarioByEmail(email);
        validarParticipacionEnMision(misionId, usuario.getId());

        MisionProgreso progreso = misionProgresoRepository.findByIdAndMisionId(progresoId, misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guardado de progreso no encontrado"));

        validarPropietario(progreso, usuario.getId());
        return toResponse(progreso);
    }

    private void aplicarDatosGuardado(
            MisionProgreso progreso,
            MisionProgresoSaveDTO dto,
            MisionEscenario escenario,
            TipoGuardadoProgreso tipoGuardado,
            Integer numeroGuardado
    ) {
        progreso.setTipoGuardado(tipoGuardado);
        progreso.setNumeroGuardado(numeroGuardado);
        progreso.setMisionEscenario(escenario);
        progreso.setEstadoJson(dto.estadoJson().trim());
        progreso.setResumenJson(normalizeNullableText(dto.resumenJson()));
        progreso.setUltimaTiradaJson(normalizeNullableText(dto.ultimaTiradaJson()));
        progreso.setCheckpointActual(normalizeNullableText(dto.checkpointActual()));
        progreso.setPorcentajeAvance(dto.porcentajeAvance());
        progreso.setEsRecuperable(dto.esRecuperable() == null || dto.esRecuperable());
        progreso.setNombreGuardado(normalizeNullableText(dto.nombreGuardado()));
        progreso.setDescripcionGuardado(normalizeNullableText(dto.descripcionGuardado()));
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private Mision getMisionById(Long misionId) {
        return misionRepository.findById(misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Misión no encontrada"));
    }

    private Personaje getPersonajeValido(Long usuarioId, Mision mision, Long personajeId) {
        validarParticipacionEnMision(mision.getId(), usuarioId);

        Personaje personaje = personajeRepository.findById(personajeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));

        if (!personaje.getUsuario().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes guardar progreso con personajes de otro usuario");
        }

        boolean unido = campanaPersonajeRepository.existsByCampanaIdAndPersonajeId(mision.getCampana().getId(), personajeId);
        if (!unido) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El personaje no está unido a la campaña de la misión");
        }

        return personaje;
    }

    private MisionEscenario getEscenarioValido(Long misionId, Long misionEscenarioId) {
        if (misionEscenarioId == null) {
            return null;
        }

        return misionEscenarioRepository.findByIdAndMisionId(misionEscenarioId, misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El escenario no pertenece a la misión indicada"));
    }

    private void validarParticipacionEnMision(Long misionId, Long usuarioId) {
        boolean participa = misionParticipanteRepository.existsByMisionIdAndUsuarioId(misionId, usuarioId);
        if (!participa) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No participas en esta misión");
        }
    }

    private void validarPropietario(MisionProgreso progreso, Long usuarioId) {
        if (!progreso.getUsuario().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El guardado no pertenece al usuario autenticado");
        }
    }

    private MisionProgresoResponseDTO toResponse(MisionProgreso progreso) {
        return new MisionProgresoResponseDTO(
                progreso.getId(),
                progreso.getMision().getId(),
                progreso.getUsuario().getId(),
                progreso.getPersonaje().getId(),
                progreso.getPersonaje().getNombre(),
                progreso.getMisionEscenario() != null ? progreso.getMisionEscenario().getId() : null,
                progreso.getTipoGuardado().name(),
                progreso.getNumeroGuardado(),
                progreso.getNombreGuardado(),
                progreso.getDescripcionGuardado(),
                progreso.getEstadoJson(),
                progreso.getResumenJson(),
                progreso.getUltimaTiradaJson(),
                progreso.getCheckpointActual(),
                progreso.getPorcentajeAvance(),
                progreso.isEsRecuperable(),
                progreso.getCreadoEn() != null ? progreso.getCreadoEn().toString() : null,
                progreso.getActualizadoEn() != null ? progreso.getActualizadoEn().toString() : null
        );
    }
}

