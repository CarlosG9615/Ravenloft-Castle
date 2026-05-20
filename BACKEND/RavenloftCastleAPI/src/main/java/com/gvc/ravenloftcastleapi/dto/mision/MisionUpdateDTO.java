package com.gvc.ravenloftcastleapi.dto.mision;

import java.util.List;

public record MisionUpdateDTO(
    String nombre,
    String descripcion,
    Integer orden,
    String dificultad,
    Integer xpRecompensa,
    Boolean completada,
    List<MisionEscenarioCreateDTO> escenarios
) {}

