package com.gvc.ravenloftcastleapi.dto.escenario;

import jakarta.validation.constraints.NotBlank;

public record EscenarioCreateDTO(
    @NotBlank(message = "El nombre es obligatorio")
    String nombre,
    String descripcion,
    @NotBlank(message = "El objeto es obligatorio")
    String objeto,
    @NotBlank(message = "La iluminación es obligatoria")
    String iluminacion,
    @NotBlank(message = "El terreno es obligatorio")
    String terreno
) {}

