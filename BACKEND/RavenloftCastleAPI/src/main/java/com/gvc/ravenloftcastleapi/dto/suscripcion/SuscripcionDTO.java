package com.gvc.ravenloftcastleapi.dto.suscripcion;

import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuscripcionDTO {
    private Long id;
    private Long usuarioId;
    private String nombre;
    private TipoSuscripcion tipo;
    private String estado;
    private LocalDate fechaAlta;
    private LocalDate fechaBaja;
}
