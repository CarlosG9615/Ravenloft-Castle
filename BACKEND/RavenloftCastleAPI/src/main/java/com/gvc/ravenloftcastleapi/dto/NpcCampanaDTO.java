package com.gvc.ravenloftcastleapi.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NpcCampanaDTO {
    private Long id;
    private Long campanaId;
    private String nombre;
    private String descripcion;
    private String rol;
    private String imagenUrl;
}
