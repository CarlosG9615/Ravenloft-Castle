package com.gvc.ravenloftcastleapi.dto.escenario;

public record EscenarioDTO(
    Long id,
    String nombre,
    String descripcion,
    String objeto,
    String iluminacion,
    String terreno
) {}
