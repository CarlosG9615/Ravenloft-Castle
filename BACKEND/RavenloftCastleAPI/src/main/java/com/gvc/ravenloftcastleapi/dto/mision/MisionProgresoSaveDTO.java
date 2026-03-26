package com.gvc.ravenloftcastleapi.dto.mision;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MisionProgresoSaveDTO(
        @NotNull Long personajeId,
        Long misionEscenarioId,
        @NotBlank String estadoJson,
        String resumenJson,
        String ultimaTiradaJson,
        String checkpointActual,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal porcentajeAvance,
        Boolean esRecuperable,
        String nombreGuardado,
        String descripcionGuardado
) {}

