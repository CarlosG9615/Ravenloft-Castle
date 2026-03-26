package com.gvc.ravenloftcastleapi.dto.personaje;

import com.gvc.ravenloftcastleapi.dto.catalogo.ClaseResumenDTO;
import com.gvc.ravenloftcastleapi.dto.catalogo.RazaResumenDTO;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record PersonajeCreacionConfigDTO(
        int puntosBasePorAtributo,
        int puntosExtraParaRepartir,
        int totalBasePermitido,
        int minimoAtributoBase,
        int maximoAtributoBase,
        int nivelMinimo,
        int nivelMaximo,
        String formulaSaludMaxima,
        Map<Integer, Integer> bonificacionCompetenciaPorNivel,
        List<RazaResumenDTO> razas,
        List<ClaseResumenDTO> clases
) {}

