package com.gvc.ravenloftcastleapi.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionParticipanteUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import com.gvc.ravenloftcastleapi.entity.ModoHistoria;
import com.gvc.ravenloftcastleapi.entity.ModoHistoriaPersonaje;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Suscripcion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.enums.RolParticipante;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;
import com.gvc.ravenloftcastleapi.repository.ModoHistoriaPersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.SuscripcionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MisionParticipanteService {

    public static final int MAX_TOTAL_PARTICIPANTES = 5;
    public static final int MAX_JUGADORES = 4;
    public static final int MAX_MASTERS = 1;

    private final MisionParticipanteRepository participanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final MisionRepository misionRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final PersonajeRepository personajeRepository;
    private final ModoHistoriaPersonajeRepository modoHistoriaPersonajeRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.gvc.ravenloftcastleapi.repository.MensajeChatRepository mensajeChatRepository;
    private final MisionService misionService;

    // Posiciones de spawn iniciales para jugadores, fijas según ordenUnion
    private static final int[][] SPAWN_POSITIONS = {
        {12, 18},  // jugador 0 (rojo)
        {13, 18},  // jugador 1 (azul)
        {12, 19},  // jugador 2 (amarillo)
        {13, 19}   // jugador 3 (verde)
    };

    @Transactional
    public MisionParticipanteResponseDTO crear(String email, Long misionId, MisionParticipanteCreateDTO dto) {
        Usuario currentUser = getUsuarioByEmail(email);
        Mision mision = getMisionById(misionId);

        Long usuarioObjetivoId = resolveUsuarioObjetivoId(currentUser, dto.usuarioId());
        Usuario usuarioObjetivo = getUsuarioById(usuarioObjetivoId);

        validarSuscripcionActiva(usuarioObjetivoId, mision.getModoHistoria());

        var existenteOpt = participanteRepository.findByMisionIdAndUsuarioId(misionId, usuarioObjetivoId);
        if (existenteOpt.isPresent()) {
            return toResponse(existenteOpt.get());
        }

        validarNoDuplicado(misionId, usuarioObjetivoId, null);
        validarCapacidadPorRol(misionId, dto.rol(), null);

        Personaje personaje = resolvePersonajeParaRol(
            dto.rol(),
            dto.personajeId(),
            usuarioObjetivoId,
            mision.getModoHistoria().getId()
        );

        List<MisionParticipante> existentes = participanteRepository.findByMisionId(mision.getId());
        // Solo los jugadores cuentan para ordenUnion; el master no ocupa slot de color/spawn
        int ordenUnion = dto.rol() == RolParticipante.JUGADOR
                ? (int) existentes.stream().filter(p -> p.getRol() == RolParticipante.JUGADOR).count()
                : existentes.size();
        int spawnCol = 12;
        int spawnRow = 19;
        if (dto.rol() == RolParticipante.JUGADOR && ordenUnion < SPAWN_POSITIONS.length) {
            spawnCol = SPAWN_POSITIONS[ordenUnion][0];
            spawnRow = SPAWN_POSITIONS[ordenUnion][1];
        }

        MisionParticipante participante = MisionParticipante.builder()
                .mision(mision)
                .usuario(usuarioObjetivo)
                .personaje(personaje)
                .rol(dto.rol())
                .fechaInicio(LocalDateTime.now())
                .tokenCol(spawnCol)
                .tokenRow(spawnRow)
                .ordenUnion(ordenUnion)
                .build();

        return toResponse(participanteRepository.save(participante));
    }

    @Transactional(readOnly = true)
    public List<MisionParticipanteResponseDTO> listarPorMision(String email, Long misionId) {
        Usuario currentUser = getUsuarioByEmail(email);
        validarLecturaMision(misionId, currentUser);

        var lista = participanteRepository.findByMisionId(misionId);
        lista.sort((a, b) -> {
            if (a.getFechaInicio() == null && b.getFechaInicio() == null) return 0;
            if (a.getFechaInicio() == null) return 1;
            if (b.getFechaInicio() == null) return -1;
            return a.getFechaInicio().compareTo(b.getFechaInicio());
        });

        java.util.List<MisionParticipanteResponseDTO> salida = new java.util.ArrayList<>();
        for (int i = 0; i < lista.size(); i++) {
            salida.add(toResponseWithOrder(lista.get(i), i));
        }

        return salida;
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
        validarCapacidadPorRol(misionId, dto.rol(), participante.getId());

        Personaje personaje = resolvePersonajeParaRol(
                dto.rol(),
                dto.personajeId(),
                participante.getUsuario().getId(),
                participante.getMision().getModoHistoria().getId()
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

        Long modoHistoriaId = participante.getMision().getModoHistoria().getId();
        Long pjId = participante.getPersonaje() != null ? participante.getPersonaje().getId() : null;
        Long usuarioId = participante.getUsuario().getId();
        Integer ordenUnion = participante.getOrdenUnion();

        participanteRepository.delete(participante);
        participanteRepository.flush();

        if (ordenUnion != null) {
            participanteRepository.decrementarOrdenesSuperiores(misionId, ordenUnion);
        }

        limpiarModoHistoriaPersonajeSiSinPartidas(modoHistoriaId, pjId, usuarioId);
        broadcastParticipantes(misionId);
    }

    @Transactional
    public void eliminarPorPersonaje(String email, Long misionId, Long personajeId) {
        Usuario currentUser = getUsuarioByEmail(email);

        MisionParticipante participante = participanteRepository.findByMisionIdAndPersonajeId(misionId, personajeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participante con ese personaje no encontrado en la mision"));

        validarGestionParticipante(participante, currentUser);

        Long modoHistoriaId = participante.getMision().getModoHistoria().getId();
        Long pjId = participante.getPersonaje() != null ? participante.getPersonaje().getId() : null;
        Long usuarioId = participante.getUsuario().getId();
        Integer ordenUnion = participante.getOrdenUnion();
        String nombrePersonaje = participante.getPersonaje() != null ? participante.getPersonaje().getNombre() : null;

        participanteRepository.delete(participante);
        participanteRepository.flush();

        if (ordenUnion != null) {
            participanteRepository.decrementarOrdenesSuperiores(misionId, ordenUnion);
        }

        limpiarModoHistoriaPersonajeSiSinPartidas(modoHistoriaId, pjId, usuarioId);

        try {
            if (pjId != null) {
                mensajeChatRepository.deleteMensajesByMisionIdAndPersonajeId(misionId, pjId);
            }
            if (nombrePersonaje != null) {
                mensajeChatRepository.deleteLegacyMensajesByMisionIdAndAutor(misionId, nombrePersonaje);
            }
        } catch (Exception e) {
            System.err.println("[Abandon] Error limpiando mensajes del chat, continuando: " + e.getMessage());
        }

        if (participanteRepository.findByMisionId(misionId).isEmpty()) {
            mensajeChatRepository.deleteByMisionId(misionId);
        }

        broadcastParticipantes(misionId);
        resetTurnoTrasAbandono(misionId, pjId);
    }

    @Transactional
    public void eliminarTodos(String email, Long misionId) {
        Usuario currentUser = getUsuarioByEmail(email);
        List<MisionParticipante> participantes = participanteRepository.findByMisionId(misionId);

        boolean esMaster = participantes.stream().anyMatch(p ->
                p.getUsuario().getId().equals(currentUser.getId()) &&
                p.getRol() == com.gvc.ravenloftcastleapi.enums.RolParticipante.MASTER);

        if (!esMaster) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el master puede eliminar todos los participantes");
        }

        Long modoHistoriaId = participantes.isEmpty() ? null : participantes.get(0).getMision().getModoHistoria().getId();

        for (MisionParticipante p : participantes) {
            Long pjId = p.getPersonaje() != null ? p.getPersonaje().getId() : null;
            Long usuarioId = p.getUsuario().getId();
            limpiarModoHistoriaPersonajeSiSinPartidas(modoHistoriaId, pjId, usuarioId);
        }

        participanteRepository.deleteByMisionId(misionId);

        try {
            mensajeChatRepository.deleteByMisionId(misionId);
        } catch (Exception e) {
            System.err.println("[MasterAbort] Error limpiando chat: " + e.getMessage());
        }

        // Limpiar configPartida cuando se termina la partida
        try {
            misionService.limpiarConfigPartida(misionId);
        } catch (Exception e) {
            System.err.println("[MasterAbort] Error limpiando configPartida: " + e.getMessage());
        }

        messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/jugadores", java.util.Collections.emptyList());
    }

    private void limpiarModoHistoriaPersonajeSiSinPartidas(Long modoHistoriaId, Long personajeId, Long usuarioId) {
        if (personajeId == null) return;
        if (!participanteRepository.existsByMisionModoHistoriaIdAndUsuarioId(modoHistoriaId, usuarioId)) {
            modoHistoriaPersonajeRepository.deleteByModoHistoriaIdAndPersonajeId(modoHistoriaId, personajeId);
        }
    }

    private void broadcastParticipantes(Long misionId) {
        List<com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO> lista =
                participanteRepository.findParticipantesJugadores(misionId);
        messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/jugadores", lista);
    }

    private void resetTurnoTrasAbandono(Long misionId, Long personajeIdQueAbandona) {
        List<com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO> restantes =
                participanteRepository.findParticipantesJugadores(misionId);
        misionRepository.findById(misionId).ifPresent(m -> {
            if (restantes.isEmpty()) {
                // Última persona: limpiar todo el estado de turno para que la próxima partida empiece desde cero
                m.setTurnoActualPersonajeId(null);
                m.setTurnoFase(null);
                misionRepository.save(m);
                // Notificar a todos que el turno vuelve a personajes (fase limpia)
                messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno",
                    new com.gvc.ravenloftcastleapi.dto.mision.TurnoDTO(null, "personajes"));
                // Limpiar salas reveladas para que la próxima partida empiece con el mapa cerrado
                Object roomsReset = java.util.Map.of("revealedRooms", java.util.Collections.emptyList());
                messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/rooms-state", roomsReset);
            } else if ("master".equals(m.getTurnoFase())
                    || !java.util.Objects.equals(personajeIdQueAbandona, m.getTurnoActualPersonajeId())) {
                // Turno activo no afectado: no modificar
                String fase = m.getTurnoFase() != null ? m.getTurnoFase() : "personajes";
                messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno",
                    new com.gvc.ravenloftcastleapi.dto.mision.TurnoDTO(m.getTurnoActualPersonajeId(), fase));
            } else {
                m.setTurnoActualPersonajeId(restantes.get(0).personajeId());
                m.setTurnoFase("personajes");
                misionRepository.save(m);
                messagingTemplate.convertAndSend("/topic/mision/" + misionId + "/turno",
                    new com.gvc.ravenloftcastleapi.dto.mision.TurnoDTO(
                        m.getTurnoActualPersonajeId(), m.getTurnoFase()));
            }
        });
    }

    @Transactional(readOnly = true)
    public java.util.Optional<MisionParticipanteResponseDTO> getMiParticipacion(String email, Long misionId) {
        Usuario currentUser = getUsuarioByEmail(email);
        return participanteRepository.findByMisionIdAndUsuarioId(misionId, currentUser.getId())
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public boolean tieneMaster(Long misionId) {
        return participanteRepository.existsByMisionIdAndRol(misionId, RolParticipante.MASTER);
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

    @Transactional
    public List<com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO> listarParticipantesJugadores(String email, Long misionId) {
        Usuario currentUser = getUsuarioByEmail(email);
        ensureParticipacionParaLectura(misionId, currentUser);

        return participanteRepository.findParticipantesJugadores(misionId);
    }

    private void ensureParticipacionParaLectura(Long misionId, Usuario currentUser) {
        if (isAdmin(currentUser) || participanteRepository.existsByMisionIdAndUsuarioId(misionId, currentUser.getId())) {
            return;
        }

        Mision mision = getMisionById(misionId);
        validarSuscripcionActiva(currentUser.getId(), mision.getModoHistoria());

        List<com.gvc.ravenloftcastleapi.entity.ModoHistoriaPersonaje> personajesUnidos =
                modoHistoriaPersonajeRepository.findByModoHistoriaIdAndPersonajeUsuarioId(
                        mision.getModoHistoria().getId(),
                        currentUser.getId()
                );

        if (personajesUnidos.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes personaje unido al modo historia de esta mision");
        }
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

    private void validarSuscripcionActiva(Long usuarioId, ModoHistoria modoHistoria) {
        TipoSuscripcion nivel = modoHistoria.getNivelAcceso();
        if (nivel == null) return; // contenido gratuito, acceso libre

        boolean tieneSuscripcion = suscripcionRepository.findByUsuarioIdAndEstadoIgnoreCase(usuarioId, "ACTIVA")
                .stream()
                .map(Suscripcion::getTipo)
                .anyMatch(tipo -> tipo != null && tipo.canAccess(nivel));

        if (!tieneSuscripcion) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sin suscripcion activa para esta modoHistoria");
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

    private void validarCapacidadPorRol(Long misionId, RolParticipante rolSolicitado, Long participanteIdExcluido) {
        List<MisionParticipante> participantes = participanteRepository.findByMisionId(misionId)
                .stream()
                .filter(p -> participanteIdExcluido == null || !p.getId().equals(participanteIdExcluido))
                .toList();

        int totalActual = participantes.size();
        int jugadoresActuales = (int) participantes.stream().filter(p -> p.getRol() == RolParticipante.JUGADOR).count();
        int mastersActuales = (int) participantes.stream().filter(p -> p.getRol() == RolParticipante.MASTER).count();

        if (totalActual >= MAX_TOTAL_PARTICIPANTES) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La partida ya alcanzo el maximo de " + MAX_TOTAL_PARTICIPANTES + " participantes");
        }

        if (rolSolicitado == RolParticipante.JUGADOR && jugadoresActuales >= MAX_JUGADORES) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La partida ya tiene el maximo de " + MAX_JUGADORES + " jugadores");
        }

        if (rolSolicitado == RolParticipante.MASTER && mastersActuales >= MAX_MASTERS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La partida ya tiene un master asignado");
        }
    }

    private Personaje resolvePersonajeParaRol(RolParticipante rol, Long personajeId, Long usuarioId, Long modoHistoriaId) {
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

        boolean unidoEnModoHistoria = modoHistoriaPersonajeRepository.existsByModoHistoriaIdAndPersonajeId(modoHistoriaId, personajeId);
        if (!unidoEnModoHistoria) {
            ModoHistoriaPersonaje relacion = ModoHistoriaPersonaje.builder()
                    .modoHistoria(ModoHistoria.builder().id(modoHistoriaId).build())
                    .personaje(personaje)
                    .fechaUnion(LocalDate.now())
                    .build();
            modoHistoriaPersonajeRepository.save(relacion);
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
        return toResponseWithOrder(participante, null);
    }

    private MisionParticipanteResponseDTO toResponseWithOrder(MisionParticipante participante, Integer ordenUnion) {
        return new MisionParticipanteResponseDTO(
                participante.getId(),
                participante.getMision().getId(),
                participante.getUsuario().getId(),
                participante.getUsuario().getNombre(),
                participante.getRol().name(),
                participante.getPersonaje() != null ? participante.getPersonaje().getId() : null,
                participante.getPersonaje() != null ? participante.getPersonaje().getNombre() : null,
                participante.getFechaInicio() != null ? participante.getFechaInicio().toString() : null,
                ordenUnion
        );
    }
}

