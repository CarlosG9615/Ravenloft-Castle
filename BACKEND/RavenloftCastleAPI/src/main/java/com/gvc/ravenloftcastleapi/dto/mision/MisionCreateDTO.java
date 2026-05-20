package com.gvc.ravenloftcastleapi.dto.mision;

import java.util.List;

public record MisionCreateDTO(
        Long modoHistoriaId,
        String nombre,
        String descripcion,
        int orden,
        String dificultad,
        int xpRecompensa,
        List<MisionEscenarioCreateDTO> escenarios
) {}


