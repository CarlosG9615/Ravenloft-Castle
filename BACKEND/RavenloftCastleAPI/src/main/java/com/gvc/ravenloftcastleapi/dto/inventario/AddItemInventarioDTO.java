package com.gvc.ravenloftcastleapi.dto.inventario;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddItemInventarioDTO(
        @NotNull Long personajeId,
        @NotBlank String tipo,
        @NotNull Long itemId,
        @Min(1) int cantidad
) {}

