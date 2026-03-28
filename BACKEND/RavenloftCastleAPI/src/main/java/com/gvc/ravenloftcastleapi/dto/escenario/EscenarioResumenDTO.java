package com.gvc.ravenloftcastleapi.dto.escenario;

public record EscenarioResumenDTO(
        Long id,
        String nombre,
        String iluminacion,
        String terreno,
        int orden,
        double multiplicadorEnemigos,
        int dificultad
) {}
