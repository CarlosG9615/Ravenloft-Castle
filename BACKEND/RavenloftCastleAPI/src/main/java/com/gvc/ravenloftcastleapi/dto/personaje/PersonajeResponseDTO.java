package com.gvc.ravenloftcastleapi.dto.personaje;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonajeResponseDTO {

    private Long id;
    private String nombre;
    private String clase;
    private String raza;
    private Integer nivel;
    private Integer fuerza;
    private Integer destreza;
    private Integer constitucion;
    private Integer inteligencia;
    private Integer sabiduria;
    private Integer carisma;
    private Integer puntosGolpeMax;
    private Integer puntosGolpeActual;
    private Integer claseArmadura;
    private Integer iniciativa;
    private Integer velocidad;
    private Integer bonificacionCompetencia;
    private String alineamiento;
    private Long usuarioId;
}
