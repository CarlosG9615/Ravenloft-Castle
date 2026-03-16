package com.gvc.ravenloftcastleapi.dto.catalogo;
public record ClaseResumenDTO(
        Long id,
        String nombre,
        String descripcion,
        int dadoGolpe,
        String statPrincipal,
        String armaduraPermitida,
        String caracteristicaClase
) {}