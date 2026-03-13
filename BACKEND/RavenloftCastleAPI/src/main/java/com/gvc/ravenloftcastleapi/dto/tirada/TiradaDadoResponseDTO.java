package com.gvc.ravenloftcastleapi.dto.tirada;
public record TiradaDadoResponseDTO(
        Long id,
        String personajeNombre,
        String tipoTirada,
        String dado,
        int resultadoDado,
        int modificador,
        int resultadoFinal,
        boolean ventaja,
        String descripcion,
        String fecha
) {}