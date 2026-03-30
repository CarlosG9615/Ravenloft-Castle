package com.gvc.ravenloftcastleapi.dto.inventario;

public record ArmaDTO(
        Long id,
        String nombre,
        String descripcion,
        String damageDice,
        String tipoDano,
        int bonusAtaque,
        int bonusDano,
        String rareza,
        String tipoPermitido,
        int nivelMin,
        String propiedades
) {}

