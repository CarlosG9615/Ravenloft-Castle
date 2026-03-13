package com.gvc.ravenloftcastleapi.dto.mision;

public record MisionResumenDTO(
        Long id,
        String nombre,
        String dificultad,
        int xpRecompensa,
        boolean completada
) {}

