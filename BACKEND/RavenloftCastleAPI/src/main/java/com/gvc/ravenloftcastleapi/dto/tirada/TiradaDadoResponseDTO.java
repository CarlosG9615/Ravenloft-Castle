package com.gvc.ravenloftcastleapi.dto.tirada;
public record TiradaDadoResponseDTO(
        Long id,
        Long misionId,
        Long campanaId,
        Long personajeId,
        String personajeNombre,
        Long misionProgresoId,
        String tipoGuardadoProgreso,
        String tipoTirada,
        String dado,
        int resultadoDado,
        int modificador,
        int resultadoFinal,
        boolean ventaja,
        String descripcion,
        String fecha
) {}