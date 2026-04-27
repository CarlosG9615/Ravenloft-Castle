package com.gvc.ravenloftcastleapi.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampanaResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private String calcDistancia;
    private String logo;
    private String imagen;
    private Long masterId;
    private String masterNombre;
    private List<Integer> mapasSeleccionados;
    private String dificultad;
    private Integer maxJugadores;
    private Integer nivelMinimo;
    private String sistema;
    private Boolean active;
}