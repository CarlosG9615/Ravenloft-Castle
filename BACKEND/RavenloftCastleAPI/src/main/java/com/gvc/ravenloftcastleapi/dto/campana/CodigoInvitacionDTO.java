package com.gvc.ravenloftcastleapi.dto.campana;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodigoInvitacionDTO {

    @NotBlank(message = "El código es obligatorio")
    private String codigo;
}

