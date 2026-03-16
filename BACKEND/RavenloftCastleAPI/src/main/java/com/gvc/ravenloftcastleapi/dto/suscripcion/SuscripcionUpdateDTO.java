package com.gvc.ravenloftcastleapi.dto.suscripcion;

import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuscripcionUpdateDTO {
    private TipoSuscripcion tipo;
    private String estado;
}

