package com.gvc.ravenloftcastleapi.dto.mision;

public record ParticipanteJugadorDTO(
        Long usuarioId,
        Long personajeId,
        String nombreUsuario,
        String nombrePersonaje,
        String clase,
        Integer nivel,
        Integer saludActual,
        Integer saludMax,
        String avatar,
        Integer tokenCol,
        Integer tokenRow,
        Integer ordenUnion
) {
}
