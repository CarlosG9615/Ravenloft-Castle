package com.gvc.ravenloftcastleapi.dto.personaje;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record StatsBaseDTO(
        @Min(8) @Max(15) int fuerza,
        @Min(8) @Max(15) int destreza,
        @Min(8) @Max(15) int constitucion,
        @Min(8) @Max(15) int inteligencia,
        @Min(8) @Max(15) int sabiduria,
        @Min(8) @Max(15) int carisma
) {}

