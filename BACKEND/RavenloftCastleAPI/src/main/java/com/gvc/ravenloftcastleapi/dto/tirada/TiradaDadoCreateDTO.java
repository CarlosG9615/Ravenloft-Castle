package com.gvc.ravenloftcastleapi.dto.tirada;
public record TiradaDadoCreateDTO(
        Long personajeId,
        Long campanaId,
        String tipoTirada,
        String dado,
        int resultadoDado,
        int modificador,
        boolean ventaja,
        String descripcion
) {}