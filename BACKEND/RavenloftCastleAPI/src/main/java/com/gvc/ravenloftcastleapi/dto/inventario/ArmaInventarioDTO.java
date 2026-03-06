package com.gvc.ravenloftcastleapi.dto.inventario;

public record ArmaInventarioDTO(
        Long inventarioId,
        String nombre,
        String damageDice,
        String tipoDano,
        int bonusAtaque,
        int bonusDano,
        String rareza,
        boolean equipado,
        int cantidad
) {}

