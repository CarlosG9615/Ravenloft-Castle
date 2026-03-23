package com.gvc.ravenloftcastleapi.dto.mision;

public record MisionResumenDTO(
        Long id,
        String nombre,
        String descripcion,
        int orden,
        String dificultad,
        int xpRecompensa,
        boolean completada
) {}

