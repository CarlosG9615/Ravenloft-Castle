package com.gvc.ravenloftcastleapi.dto.inventario;

public record PocionDTO(
        Long id,
        String nombre,
        String descripcion,
        int recuperacionSalud,
        int recuperacionMana,
        String rareza,
        int precioPo
) {}

