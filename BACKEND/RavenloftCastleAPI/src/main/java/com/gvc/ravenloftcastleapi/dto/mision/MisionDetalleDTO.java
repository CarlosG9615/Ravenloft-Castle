package com.gvc.ravenloftcastleapi.dto.mision;

import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioResumenDTO;

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

