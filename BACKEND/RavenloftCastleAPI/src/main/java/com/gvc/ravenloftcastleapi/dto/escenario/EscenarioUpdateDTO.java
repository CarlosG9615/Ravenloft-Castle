package com.gvc.ravenloftcastleapi.dto.escenario;

public record EscenarioUpdateDTO(
    String nombre,
    String descripcion,
    String objeto,
    String iluminacion,
    String terreno
) {}

