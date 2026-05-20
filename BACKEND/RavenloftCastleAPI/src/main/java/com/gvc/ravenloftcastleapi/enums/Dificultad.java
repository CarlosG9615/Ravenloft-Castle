package com.gvc.ravenloftcastleapi.enums;

import java.text.Normalizer;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Dificultad {
    FACIL,
    MEDIA,
    DIFICIL,
    EPICA;

    @JsonCreator
    public static Dificultad fromString(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase();

        for (Dificultad dificultad : Dificultad.values()) {
            if (dificultad.name().equals(normalizedValue)) {
                return dificultad;
            }
        }

        throw new IllegalArgumentException("La dificultad solo puede ser FACIL, MEDIA, DIFICIL o EPICA");
    }

    public static Dificultad fromDatabaseValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String normalizedValue = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase();


        for (Dificultad dificultad : Dificultad.values()) {
            if (dificultad.name().equals(normalizedValue)) {
                return dificultad;
            }
        }

        throw new IllegalArgumentException("Valor de dificultad invalido en base de datos: " + value);
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}

