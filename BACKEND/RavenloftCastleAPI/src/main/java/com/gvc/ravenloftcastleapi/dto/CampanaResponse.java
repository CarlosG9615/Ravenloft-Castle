package com.gvc.ravenloftcastleapi.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampanaResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private String codigoInvitacion;
    private String dificultad;
    private String logo;
    private String imagen;
    private String mapasSeleccionados;
    private Long masterId;
    private String masterNombre;
    private Integer maxJugadores;
    private Integer numSesiones;
    private String sistema;
    private String estado;
    private Boolean active;
}