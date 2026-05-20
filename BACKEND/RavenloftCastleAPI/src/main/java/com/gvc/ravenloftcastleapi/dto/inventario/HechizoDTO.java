package com.gvc.ravenloftcastleapi.dto.inventario;

public record HechizoDTO(
        Long id,
        String nombre,
        String descripcion,
        int nivelHechizo,
        String escuela,
        String damageDice,
        String tipoDano,
        int costeMana,
        String rareza,
        String tipoPermitido,
        int nivelMin,
        String alcance,
        String duracion
) {}

