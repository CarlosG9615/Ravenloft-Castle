package com.gvc.ravenloftcastleapi.dto.campana;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public record CampanaEnemigoRequestDTO(
        @NotNull Long enemigoId,
        @NotNull @Min(1) Integer cantidad
) {}

