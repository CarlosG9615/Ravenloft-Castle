package com.gvc.ravenloftcastleapi.dto.inventario;

public record AddItemInventarioDTO(
        Long personajeId,
        String tipo,      // "arma", "armadura", "hechizo", "pocion"
        Long itemId,
        int cantidad
) {}

