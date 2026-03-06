package com.gvc.ravenloftcastleapi.dto.catalogo;
public record ClaseResumenDTO(
        Long id,
        String nombre,
        int dadoGolpe,
        String statPrincipal,
        String armaduraPermitida
) {}