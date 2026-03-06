package com.gvc.ravenloftcastleapi.dto.mision;

import java.util.List;

public record MisionDetalleDTO(
        Long id,
        String nombre,
        String descripcion,
        int orden,
        String dificultad,
        int xpRecompensa,
        boolean completada,
        List<EscenarioResumenDTO> escenarios
) {}

