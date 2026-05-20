package com.gvc.ravenloftcastleapi.dto.inventario;

import jakarta.validation.constraints.Min;

public record UpdateInventarioItemDTO(
        @Min(1) int cantidad,
        Boolean equipado
) {}


