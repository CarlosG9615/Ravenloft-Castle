package com.gvc.ravenloftcastleapi.dto.suscripcion;

import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuscripcionCreateDTO {
    @NotNull(message = "El id del usuario es obligatorio")
    private Long usuarioId;

    @NotNull(message = "El nombre de la suscripción es obligatorio")
    private String nombre;

    @NotNull(message = "El tipo de suscripción es obligatorio")
    private TipoSuscripcion tipo;
}
