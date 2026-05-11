package com.gvc.ravenloftcastleapi.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO;
import com.gvc.ravenloftcastleapi.dto.mision.TurnoDTO;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TurnoService {

    private final MisionParticipanteRepository misionParticipanteRepository;
    private final MisionRepository misionRepository;

    @Transactional(readOnly = true)
    public TurnoDTO obtenerTurnoActual(Long misionId) {
        return misionRepository.findById(misionId)
            .filter(m -> m.getTurnoActualPersonajeId() != null)
            .map(m -> new TurnoDTO(
                m.getTurnoActualPersonajeId(),
                m.getTurnoFase() != null ? m.getTurnoFase() : "personajes"
            ))
            .orElseGet(() -> primerJugador(misionId));
    }

    @Transactional
    public TurnoDTO iniciarNuevaRonda(Long misionId) {
        misionParticipanteRepository.limpiarTodosLosDados(misionId);
        TurnoDTO turno = primerJugador(misionId);
        persistirTurno(misionId, turno);
        return turno;
    }

    @Transactional
    public TurnoDTO calcularSiguiente(Long misionId, Long personajeIdActual) {
        misionParticipanteRepository.limpiarDadosParticipante(misionId, personajeIdActual);

        List<ParticipanteJugadorDTO> participantes =
            misionParticipanteRepository.findParticipantesJugadores(misionId);

        TurnoDTO siguiente;
        if (participantes.isEmpty()) {
            siguiente = new TurnoDTO(null, "master");
        } else {
            int currentIndex = -1;
            for (int i = 0; i < participantes.size(); i++) {
                if (participantes.get(i).personajeId().equals(personajeIdActual)) {
                    currentIndex = i;
                    break;
                }
            }
            if (currentIndex == -1 || currentIndex >= participantes.size() - 1) {
                siguiente = new TurnoDTO(null, "master");
            } else {
                ParticipanteJugadorDTO next = participantes.get(currentIndex + 1);
                siguiente = new TurnoDTO(next.personajeId(), "personajes");
            }
        }

        persistirTurno(misionId, siguiente);
        return siguiente;
    }

    private TurnoDTO primerJugador(Long misionId) {
        List<ParticipanteJugadorDTO> participantes =
            misionParticipanteRepository.findParticipantesJugadores(misionId);
        if (participantes.isEmpty()) return new TurnoDTO(null, "master");
        return new TurnoDTO(participantes.get(0).personajeId(), "personajes");
    }

    private void persistirTurno(Long misionId, TurnoDTO turno) {
        misionRepository.findById(misionId).ifPresent(mision -> {
            mision.setTurnoActualPersonajeId(turno.turnoActualPersonajeId());
            mision.setTurnoFase(turno.fase());
            misionRepository.save(mision);
        });
    }
}
