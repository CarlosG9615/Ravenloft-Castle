package com.gvc.ravenloftcastleapi.dto.autenticacion;

public record LoginResponseDTO(
        Long id,
        String nombre,
        String email,
        String rol,
        String token
) {}
