package com.gvc.ravenloftcastleapi.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Dificultad {
    FACIL,
    MEDIA,
    DIFICIL;

    @JsonCreator
    public static Dificultad fromString(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        for (Dificultad dificultad : Dificultad.values()) {
            if (dificultad.name().equalsIgnoreCase(normalizedValue)) {
                return dificultad;
            }
        }

        throw new IllegalArgumentException("La dificultad solo puede ser FACIL, MEDIA o DIFICIL");
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}

