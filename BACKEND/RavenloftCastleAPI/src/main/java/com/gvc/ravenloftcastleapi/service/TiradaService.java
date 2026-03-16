package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.tirada.HistorialTiradasDTO;
import com.gvc.ravenloftcastleapi.dto.tirada.TiradaDadoCreateDTO;
import com.gvc.ravenloftcastleapi.dto.tirada.TiradaDadoResponseDTO;
import com.gvc.ravenloftcastleapi.dto.tirada.TiradaDadoUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.MisionProgreso;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.TiradaDado;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.CampanaPersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.MisionProgresoRepository;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.TiradaDadoRepository;
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
public class TiradaService {

    private final TiradaDadoRepository tiradaDadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MisionRepository misionRepository;
    private final MisionParticipanteRepository misionParticipanteRepository;
    private final MisionProgresoRepository misionProgresoRepository;
    private final PersonajeRepository personajeRepository;
    private final CampanaPersonajeRepository campanaPersonajeRepository;

    @Transactional
    public TiradaDadoResponseDTO crearEnMision(String email, Long misionId, TiradaDadoCreateDTO dto) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        validarParticipacionEnMision(misionId, usuario.getId());

        Personaje personaje = personajeRepository.findById(dto.personajeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));

        validarPropiedadPersonaje(usuario.getId(), personaje.getUsuario().getId());
        validarPersonajeEnCampana(mision.getCampana().getId(), personaje.getId());
        MisionProgreso progreso = resolveProgresoAsociado(misionId, usuario.getId(), personaje.getId(), dto.misionProgresoId());

        TiradaDado tirada = TiradaDado.builder()
                .personaje(personaje)
                .mision(mision)
                .campana(mision.getCampana())
                .misionProgreso(progreso)
                .tipoTirada(dto.tipoTirada().trim())
                .dado(dto.dado().trim().toUpperCase())
                .resultadoDado(dto.resultadoDado())
                .modificador(dto.modificador())
                .resultadoFinal(dto.resultadoDado() + dto.modificador())
                .ventaja(dto.ventaja())
                .descripcion(dto.descripcion())
                .fecha(LocalDateTime.now())
                .build();

        return toResponse(tiradaDadoRepository.save(tirada));
    }

    @Transactional(readOnly = true)
    public List<TiradaDadoResponseDTO> listarPorMision(String email, Long misionId) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        validarParticipacionEnMision(misionId, usuario.getId());

        List<Long> usuarioIdsParticipantes = misionParticipanteRepository.findByMisionId(misionId)
                .stream()
                .map(p -> p.getUsuario().getId())
                .distinct()
                .toList();

        return tiradaDadoRepository
                .findByMisionIdAndPersonajeUsuarioIdInOrderByFechaDesc(misionId, usuarioIdsParticipantes)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TiradaDadoResponseDTO getByIdEnMision(String email, Long misionId, Long tiradaId) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        validarParticipacionEnMision(misionId, usuario.getId());

        TiradaDado tirada = tiradaDadoRepository.findByIdAndMisionId(tiradaId, misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tirada no encontrada"));

        return toResponse(tirada);
    }

    @Transactional
    public TiradaDadoResponseDTO actualizarEnMision(String email, Long misionId, Long tiradaId, TiradaDadoUpdateDTO dto) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        validarParticipacionEnMision(misionId, usuario.getId());

        TiradaDado tirada = tiradaDadoRepository.findByIdAndMisionId(tiradaId, misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tirada no encontrada"));

        validarPropiedadPersonaje(usuario.getId(), tirada.getPersonaje().getUsuario().getId());
        MisionProgreso progreso = dto.misionProgresoId() == null && tirada.getMisionProgreso() != null
                ? tirada.getMisionProgreso()
                : resolveProgresoAsociado(misionId, usuario.getId(), tirada.getPersonaje().getId(), dto.misionProgresoId());

        tirada.setTipoTirada(dto.tipoTirada().trim());
        tirada.setDado(dto.dado().trim().toUpperCase());
        tirada.setResultadoDado(dto.resultadoDado());
        tirada.setModificador(dto.modificador());
        tirada.setResultadoFinal(dto.resultadoDado() + dto.modificador());
        tirada.setVentaja(dto.ventaja());
        tirada.setDescripcion(dto.descripcion());
        tirada.setMisionProgreso(progreso);

        return toResponse(tiradaDadoRepository.save(tirada));
    }

    @Transactional
    public void eliminarEnMision(String email, Long misionId, Long tiradaId) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        validarParticipacionEnMision(misionId, usuario.getId());

        TiradaDado tirada = tiradaDadoRepository.findByIdAndMisionId(tiradaId, misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tirada no encontrada"));

        validarPropiedadPersonaje(usuario.getId(), tirada.getPersonaje().getUsuario().getId());
        tiradaDadoRepository.delete(tirada);
    }

    @Transactional(readOnly = true)
    public HistorialTiradasDTO historialPorPersonajeEnMision(String email, Long misionId, Long personajeId) {
        Usuario usuario = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);
        validarParticipacionEnMision(misionId, usuario.getId());

        Personaje personaje = personajeRepository.findById(personajeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));

        validarPersonajeEnCampana(mision.getCampana().getId(), personajeId);

        List<TiradaDado> tiradas = tiradaDadoRepository
                .findByMisionIdAndPersonajeIdOrderByFechaDesc(misionId, personajeId);

        if (tiradas.isEmpty()) {
            return new HistorialTiradasDTO(personaje.getNombre(), 0, 0, 0, 0);
        }

        int mejor = tiradas.stream().mapToInt(TiradaDado::getResultadoFinal).max().orElse(0);
        int peor = tiradas.stream().mapToInt(TiradaDado::getResultadoFinal).min().orElse(0);
        double media = tiradas.stream().mapToInt(TiradaDado::getResultadoFinal).average().orElse(0);

        return new HistorialTiradasDTO(personaje.getNombre(), tiradas.size(), media, mejor, peor);
    }

    private Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private Mision getMisionById(Long misionId) {
        return misionRepository.findById(misionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mision no encontrada"));
    }

    private void validarParticipacionEnMision(Long misionId, Long usuarioId) {
        boolean participa = misionParticipanteRepository.existsByMisionIdAndUsuarioId(misionId, usuarioId);
        if (!participa) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No participas en esta mision");
        }
    }

    private void validarPropiedadPersonaje(Long usuarioIdEsperado, Long usuarioIdPersonaje) {
        if (!usuarioIdEsperado.equals(usuarioIdPersonaje)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes operar tiradas de personajes de otro usuario");
        }
    }

    private void validarPersonajeEnCampana(Long campanaId, Long personajeId) {
        boolean unido = campanaPersonajeRepository.existsByCampanaIdAndPersonajeId(campanaId, personajeId);
        if (!unido) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El personaje no esta unido a la campana de la mision");
        }
    }

    private MisionProgreso resolveProgresoAsociado(Long misionId, Long usuarioId, Long personajeId, Long misionProgresoId) {
        if (misionProgresoId != null) {
            MisionProgreso progreso = misionProgresoRepository.findByIdAndMisionId(misionProgresoId, misionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guardado de progreso no encontrado"));
            validarProgreso(usuarioId, personajeId, progreso);
            return progreso;
        }

        return misionProgresoRepository
                .findByMisionIdAndUsuarioIdAndPersonajeIdAndNumeroGuardado(misionId, usuarioId, personajeId, 0)
                .orElse(null);
    }

    private void validarProgreso(Long usuarioId, Long personajeId, MisionProgreso progreso) {
        if (!progreso.getUsuario().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El guardado de progreso no pertenece al usuario autenticado");
        }
        if (!progreso.getPersonaje().getId().equals(personajeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El guardado de progreso no corresponde al personaje indicado");
        }
    }

    private TiradaDadoResponseDTO toResponse(TiradaDado tirada) {
        return new TiradaDadoResponseDTO(
                tirada.getId(),
                tirada.getMision().getId(),
                tirada.getCampana().getId(),
                tirada.getPersonaje().getId(),
                tirada.getPersonaje().getNombre(),
                tirada.getMisionProgreso() != null ? tirada.getMisionProgreso().getId() : null,
                tirada.getMisionProgreso() != null ? tirada.getMisionProgreso().getTipoGuardado().name() : null,
                tirada.getTipoTirada(),
                tirada.getDado(),
                tirada.getResultadoDado(),
                tirada.getModificador(),
                tirada.getResultadoFinal(),
                tirada.isVentaja(),
                tirada.getDescripcion(),
                tirada.getFecha().toString()
        );
    }
}

