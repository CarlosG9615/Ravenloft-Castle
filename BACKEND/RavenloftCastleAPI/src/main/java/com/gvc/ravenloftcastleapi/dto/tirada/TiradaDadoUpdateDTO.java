package com.gvc.ravenloftcastleapi.dto.tirada;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record TiradaDadoUpdateDTO(
        Long misionProgresoId,
        @NotBlank String tipoTirada,
        @NotBlank String dado,
        @Min(1) @Max(100) int resultadoDado,
        int modificador,
        boolean ventaja,
        String descripcion
) {}

