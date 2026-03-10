package com.gvc.ravenloftcastleapi.dto.autenticacion;

public record UsuarioResponseDTO(
        Long id,
        String nombre,
        String email,
        String rol
) {}
