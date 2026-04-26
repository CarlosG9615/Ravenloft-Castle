package com.gvc.ravenloftcastleapi.dto.dice;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DiceRollRequestDTO(

        @NotBlank(message = "El tipo de dado es obligatorio")
        String diceType, // d4, d6, d8, d10, d12, d20, d100

        @NotNull(message = "La cantidad de dados es obligatoria")
        @Min(value = 1, message = "Mínimo 1 dado")
        Integer quantity,

        @NotNull(message = "El resultado es obligatorio")
        @Min(value = 1, message = "El resultado debe ser positivo")
        Integer result,

        @NotNull(message = "El total es obligatorio")
        @Min(value = 1, message = "El total debe ser positivo")
        Integer total,

        Long gameId // Opcional, puede ser null
) {}
