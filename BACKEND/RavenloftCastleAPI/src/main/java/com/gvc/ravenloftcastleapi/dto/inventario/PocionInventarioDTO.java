package com.gvc.ravenloftcastleapi.dto.inventario;

public record PocionInventarioDTO(
        Long inventarioId,
        String nombre,
        int recuperacionSalud,
        int recuperacionMana,
        String rareza,
        int precio,
        int cantidad
) {}

