package com.gvc.ravenloftcastleapi.dto.catalogo;
import com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO;
public record RazaResumenDTO(
        Long id,
        String nombre,
        String descripcion,
        int velocidad,
        StatsDTO bonuses
) {}