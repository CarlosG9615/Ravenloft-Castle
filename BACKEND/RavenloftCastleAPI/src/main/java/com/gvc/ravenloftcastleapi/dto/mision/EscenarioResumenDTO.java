package com.gvc.ravenloftcastleapi.dto.mision;

public record EscenarioResumenDTO(
        Long id,
        String nombre,
        String iluminacion,
        String terreno,
        int orden,
        double multiplicadorEnemigos
) {}

