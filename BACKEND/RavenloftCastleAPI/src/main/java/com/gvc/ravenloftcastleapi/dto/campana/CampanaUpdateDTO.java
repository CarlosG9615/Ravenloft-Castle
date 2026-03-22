package com.gvc.ravenloftcastleapi.dto.campana;

import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaUpdateDTO {

    private String nombre;
    private String descripcion;
    private String dificultad;
    private Integer nivelMinimo;
    private Integer maxJugadores;
    private String sistema;
    private TipoSuscripcion nivelAcceso;
    private Boolean active;
}

