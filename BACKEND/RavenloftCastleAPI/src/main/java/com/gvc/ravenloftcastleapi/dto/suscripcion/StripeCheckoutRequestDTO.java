package com.gvc.ravenloftcastleapi.dto.suscripcion;

import lombok.Data;

@Data
public class StripeCheckoutRequestDTO {
    private String tipoPlan;
    private Long usuarioId;
}

