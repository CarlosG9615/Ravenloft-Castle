package com.gvc.ravenloftcastleapi.dto.enemigo;
public record EnemigoResumenDTO(
        Long id,
        String nombre,
        String tipo,
        double cr,
        int salud,
        int ca
) {}