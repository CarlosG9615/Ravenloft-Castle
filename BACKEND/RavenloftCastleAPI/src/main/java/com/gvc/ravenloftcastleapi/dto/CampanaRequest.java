package com.gvc.ravenloftcastleapi.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampanaRequest {
    private String nombre;
    private String descripcion;
    private String calcDistancia;
    private String logo;
    private String imagen;
    private List<String> mapas;
}
