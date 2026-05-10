package com.gvc.ravenloftcastleapi.dto.mision;

public record MisionParticipanteResponseDTO(
        Long id,
        Long misionId,
        Long usuarioId,
        String usuarioNombre,
        String rol,
        Long personajeId,
        String personajeNombre,
        String fechaInicio
        , Integer ordenUnion
) {}

