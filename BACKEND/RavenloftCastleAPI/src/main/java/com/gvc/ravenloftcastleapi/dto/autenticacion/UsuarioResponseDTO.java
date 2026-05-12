package com.gvc.ravenloftcastleapi.dto.autenticacion;

import java.time.LocalDate;

public record UsuarioResponseDTO(
        Long id,
        String nombre,
        String email,
        String rol,
        String avatar,
        LocalDate fechaRegistro
) {}
