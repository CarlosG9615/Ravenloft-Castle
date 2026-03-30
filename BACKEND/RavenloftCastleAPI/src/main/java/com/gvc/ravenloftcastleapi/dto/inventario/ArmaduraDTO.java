package com.gvc.ravenloftcastleapi.dto.inventario;

public record ArmaduraDTO(
        Long id,
        String nombre,
        String descripcion,
        int caBase,
        int maxDexBonus,
        int bonusDefensa,
        String rareza,
        String tipoPermitido,
        int nivelMin,
        int requiereFuerza,
        boolean sigiloDesventaja
) {}

