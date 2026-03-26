package com.gvc.ravenloftcastleapi.dto.autenticacion;

public record UsuarioUpdateDTO(
        String nombre,
        String email,
        String password
) {}

