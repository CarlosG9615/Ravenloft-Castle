package com.gvc.ravenloftcastleapi.dto.inventario;

public record ArmaduraInventarioDTO(
        Long inventarioId,
        String nombre,
        int caBase,
        int maxDexBonus,
        int bonusDefensa,
        String rareza,
        boolean sigiloDesventaja,
        boolean equipado,
        int cantidad
) {}

