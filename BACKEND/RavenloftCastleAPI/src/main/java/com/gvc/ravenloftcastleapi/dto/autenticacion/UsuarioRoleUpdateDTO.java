package com.gvc.ravenloftcastleapi.dto.autenticacion;

import jakarta.validation.constraints.NotBlank;

public record UsuarioRoleUpdateDTO(
    @NotBlank(message = "El nombre del rol es obligatorio")
    String rol
) {}

