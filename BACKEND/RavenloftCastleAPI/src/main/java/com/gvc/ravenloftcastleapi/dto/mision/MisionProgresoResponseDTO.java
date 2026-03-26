package com.gvc.ravenloftcastleapi.dto.mision;

import java.math.BigDecimal;

public record MisionProgresoResponseDTO(
        Long id,
        Long misionId,
        Long usuarioId,
        Long personajeId,
        String personajeNombre,
        Long misionEscenarioId,
        String tipoGuardado,
        Integer numeroGuardado,
        String nombreGuardado,
        String descripcionGuardado,
        String estadoJson,
        String resumenJson,
        String ultimaTiradaJson,
        String checkpointActual,
        BigDecimal porcentajeAvance,
        boolean esRecuperable,
        String creadoEn,
        String actualizadoEn
) {}

