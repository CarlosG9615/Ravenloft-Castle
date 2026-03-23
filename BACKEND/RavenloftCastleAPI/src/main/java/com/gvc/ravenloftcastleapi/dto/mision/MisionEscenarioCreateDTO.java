package com.gvc.ravenloftcastleapi.dto.mision;

import java.math.BigDecimal;

public record MisionEscenarioCreateDTO(
    Long id,
    String nombre,
    String iluminacion,
    String terreno,
    int orden,
    BigDecimal multiplicadorEnemigos,
    Integer dificultad
) {}

