package com.gvc.ravenloftcastleapi.dto.enemigo;

import com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record EnemigoCreateDTO(
        @NotBlank String nombre,
        @NotBlank String tipo,
        @NotNull BigDecimal cr,
        @NotNull Integer salud,
        @NotNull Integer ca,
        Integer velocidad,
        Integer iniciativa,
        @NotNull StatsDTO stats,
        @NotNull Integer fuerzaAtaque,
        @NotBlank String danoAtaque,
        String descripcion
) {}

