package com.gvc.ravenloftcastleapi.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampanaRequest {
    private String nombre;
    private String descripcion;
    private Boolean active;
    private String sistema;
    private Integer maxJugadores;
    private Integer numSesiones;
    private String dificultad;
    private String mapasSeleccionados;
    private String estado;
    private String logo;
    private String imagen;
}
