package com.gvc.ravenloftcastleapi.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum EstadoCampana {
    ABIERTA,
    CERRADA;

    @JsonCreator
    public static EstadoCampana fromString(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim().toUpperCase();
        for (EstadoCampana estado : EstadoCampana.values()) {
            if (estado.name().equals(normalizedValue)) {
                return estado;
            }
        }

        throw new IllegalArgumentException("El estado de la campana solo puede ser ABIERTA o CERRADA");
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}

