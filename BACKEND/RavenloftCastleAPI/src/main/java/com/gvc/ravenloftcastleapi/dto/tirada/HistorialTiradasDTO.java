package com.gvc.ravenloftcastleapi.dto.tirada;
public record HistorialTiradasDTO(
        String personajeNombre,
        long totalTiradas,
        double mediaResultado,
        int mejorTirada,
        int peorTirada
) {}