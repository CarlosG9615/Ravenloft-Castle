package com.gvc.ravenloftcastleapi.dto;

public record PerfilPublicoDTO(
        Long id,
        String nombre,
        String avatar,
        String rol,
        int numSeguidores,
        int numSiguiendo,
        boolean yoLeSigo

) {}
