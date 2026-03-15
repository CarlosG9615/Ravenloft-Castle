package com.gvc.ravenloftcastleapi.dto.personaje;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonajeCreateDTO {

    @NotBlank
    private String nombre;

    @NotBlank
    private String clase;

    @NotBlank
    private String raza;

    @NotNull
    @Min(1)
    private Integer nivel;

    @NotNull
    @Min(1)
    @Max(30)
    private Integer fuerza;

    @NotNull
    @Min(1)
    @Max(30)
    private Integer destreza;

    @NotNull
    @Min(1)
    @Max(30)
    private Integer constitucion;

    @NotNull
    @Min(1)
    @Max(30)
    private Integer inteligencia;

    @NotNull
    @Min(1)
    @Max(30)
    private Integer sabiduria;

    @NotNull
    @Min(1)
    @Max(30)
    private Integer carisma;

    @NotNull
    @Min(1)
    private Integer puntosGolpeMax;

    @NotNull
    @Min(0)
    private Integer puntosGolpeActual;

    @NotNull
    @Min(1)
    private Integer claseArmadura;

    @NotNull
    private Integer iniciativa;

    @NotNull
    @Min(0)
    private Integer velocidad;

    @NotNull
    @Min(1)
    private Integer bonificacionCompetencia;

    private String alineamiento;

    @NotNull
    private Long usuarioId;
}
