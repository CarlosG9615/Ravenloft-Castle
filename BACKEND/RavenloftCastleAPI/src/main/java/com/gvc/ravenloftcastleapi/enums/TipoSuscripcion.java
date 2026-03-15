package com.gvc.ravenloftcastleapi.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TipoSuscripcion {
    BASICA,
    PREMIUM,
    VIP;

    @JsonCreator
    public static TipoSuscripcion fromString(String value) {
        if (value == null) {
            return null;
        }
        String normalizedValue = value.trim();
        for (TipoSuscripcion tipo : TipoSuscripcion.values()) {
            if (tipo.name().equalsIgnoreCase(normalizedValue)) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("ERROR CONFIGURACION: No encuentro el enum para valor [" + value + "]");
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
