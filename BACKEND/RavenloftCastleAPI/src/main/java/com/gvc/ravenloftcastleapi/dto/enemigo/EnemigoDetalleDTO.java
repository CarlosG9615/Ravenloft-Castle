package com.gvc.ravenloftcastleapi.dto.enemigo;
import com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO;
public record EnemigoDetalleDTO(
        Long id,
        String nombre,
        String tipo,
        double cr,
        int salud,
        int ca,
        StatsDTO stats,
        int fuerzaAtaque,
        String danoAtaque,
        String descripcion
) {}