package com.gvc.ravenloftcastleapi.dto.modo_historia;

import com.gvc.ravenloftcastleapi.enums.Dificultad;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModoHistoriaUpdateDTO {

    private String nombre;
    private String descripcion;
    private Dificultad dificultad;
    private Integer nivelMinimo;
    private Integer maxJugadores;
    private String sistema;
    private TipoSuscripcion nivelAcceso;
    private Boolean active;
}

