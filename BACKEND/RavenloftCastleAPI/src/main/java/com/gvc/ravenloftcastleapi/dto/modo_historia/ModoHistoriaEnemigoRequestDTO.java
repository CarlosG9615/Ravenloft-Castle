package com.gvc.ravenloftcastleapi.dto.modo_historia;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public record ModoHistoriaEnemigoRequestDTO(
        @NotNull Long enemigoId,
        @NotNull @Min(1) Integer cantidad
) {}


