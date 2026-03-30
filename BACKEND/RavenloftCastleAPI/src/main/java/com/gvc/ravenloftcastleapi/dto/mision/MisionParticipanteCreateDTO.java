package com.gvc.ravenloftcastleapi.dto.mision;

import com.gvc.ravenloftcastleapi.enums.RolParticipante;
import jakarta.validation.constraints.NotNull;

public record MisionParticipanteCreateDTO(
        Long usuarioId,
        @NotNull RolParticipante rol,
        Long personajeId
) {}

