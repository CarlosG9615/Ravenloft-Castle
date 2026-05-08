package com.gvc.ravenloftcastleapi.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO;
import com.gvc.ravenloftcastleapi.dto.mision.TurnoDTO;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TurnoService {

    private final MisionParticipanteRepository misionParticipanteRepository;

    @Transactional(readOnly = true)
    public TurnoDTO calcularSiguiente(Long misionId, Long personajeIdActual) {
        // Obtener todos los participantes jugadores ordenados por ordenUnion (que ya vienen ordenados por fechaInicio del repo)
        List<ParticipanteJugadorDTO> participantes = misionParticipanteRepository.findParticipantesJugadores(misionId);

        if (participantes.isEmpty()) {
            // Si no hay participantes, pasar al master
            return new TurnoDTO(null, "master");
        }

        // Encontrar el índice del personaje actual
        int currentIndex = -1;
        for (int i = 0; i < participantes.size(); i++) {
            if (participantes.get(i).personajeId().equals(personajeIdActual)) {
                currentIndex = i;
                break;
            }
        }

        // Si no encontramos el personaje o es el último, pasar al master
        if (currentIndex == -1 || currentIndex >= participantes.size() - 1) {
            return new TurnoDTO(null, "master");
        }

        // Siguiente personaje
        ParticipanteJugadorDTO siguiente = participantes.get(currentIndex + 1);
        return new TurnoDTO(siguiente.personajeId(), "personajes");
    }

    @Transactional(readOnly = true)
    public TurnoDTO obtenerTurnoInicial(Long misionId) {
        List<ParticipanteJugadorDTO> participantes = misionParticipanteRepository.findParticipantesJugadores(misionId);

        if (participantes.isEmpty()) {
            return new TurnoDTO(null, "master");
        }

        // El primer personaje comienza
        ParticipanteJugadorDTO primero = participantes.get(0);
        return new TurnoDTO(primero.personajeId(), "personajes");
    }
}
