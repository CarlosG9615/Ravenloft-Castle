package com.gvc.ravenloftcastleapi.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.List;

public enum TipoSuscripcion {
    BASICA,
    PREMIUM,
    VIP,
    ARCHIMAGO;

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

    public boolean canAccess(TipoSuscripcion requiredLevel) {
        if (requiredLevel == null) {
            return false;
        }
        return this.ordinal() >= requiredLevel.ordinal();
    }

    public static List<TipoSuscripcion> levelsAccessibleBy(TipoSuscripcion subscriptionType) {
        if (subscriptionType == null) {
            return List.of();
        }
        return Arrays.stream(TipoSuscripcion.values())
                .filter(subscriptionType::canAccess)
                .toList();
    }
}
