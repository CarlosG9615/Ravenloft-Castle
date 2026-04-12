package com.gvc.ravenloftcastleapi.dto.modo_historia;

import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoResumenDTO;

public record ModoHistoriaEnemigoResponseDTO(
        Long id,
        EnemigoResumenDTO enemigo,
        int cantidad,
        int dificultad
) {}


