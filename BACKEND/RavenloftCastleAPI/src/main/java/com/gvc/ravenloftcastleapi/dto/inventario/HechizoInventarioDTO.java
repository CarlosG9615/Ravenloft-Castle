package com.gvc.ravenloftcastleapi.dto.inventario;

public record HechizoInventarioDTO(
        Long inventarioId,
        String nombre,
        int nivelHechizo,
        String escuela,
        String damageDice,
        String tipoDano,
        int costeMana,
        String rareza,
        String alcance,
        String duracion,
        boolean equipado,
        int cantidad
) {}

