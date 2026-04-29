package com.gvc.ravenloftcastleapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private java.util.List<String> mapas;
    private Long masterId;
    private String masterNombre;
    private Integer maxJugadores;
    private Integer numSesiones;
    private String sistema;
    private String estado;
    private Boolean active;
}