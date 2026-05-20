package com.gvc.ravenloftcastleapi.dto;

import java.time.LocalDateTime;

public record SeguimientoDTO(
        Long id,
        Long usuarioId,
        String usuarioNombre,
        String usuarioAvatar,
        LocalDateTime fecha
) {}
