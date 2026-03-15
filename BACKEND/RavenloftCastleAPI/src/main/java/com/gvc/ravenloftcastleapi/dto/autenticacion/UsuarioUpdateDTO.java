package com.gvc.ravenloftcastleapi.dto.autenticacion;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UsuarioUpdateDTO(
        String nombre,

        @Email(message = "El email no tiene un formato válido")
        String email,

        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String password
) {}

