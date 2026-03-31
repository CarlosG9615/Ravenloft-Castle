package com.gvc.ravenloftcastleapi.dto.campana;

import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoResumenDTO;

public record CampanaEnemigoResponseDTO(
        Long id,
        EnemigoResumenDTO enemigo,
        int cantidad,
        int dificultad
) {}

