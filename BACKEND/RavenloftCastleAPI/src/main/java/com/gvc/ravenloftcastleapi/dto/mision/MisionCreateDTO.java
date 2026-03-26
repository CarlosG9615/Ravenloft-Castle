package com.gvc.ravenloftcastleapi.dto.mision;

public record MisionCreateDTO(
        Long campanaId,
        String nombre,
        String descripcion,
        int orden,
        String dificultad,
        int xpRecompensa
) {}

