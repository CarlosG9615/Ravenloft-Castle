package com.gvc.ravenloftcastleapi.dto.modo_historia;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodigoInvitacionDTO {

    @NotBlank(message = "El cÃ³digo es obligatorio")
    private String codigo;
}


