package com.gvc.ravenloftcastleapi.enums;

import java.text.Normalizer;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DificultadConverter implements AttributeConverter<Dificultad, String> {

    @Override
    public String convertToDatabaseColumn(Dificultad attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public Dificultad convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }

        String normalizedValue = Normalizer.normalize(dbData.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase();

        if ("MEDIO".equals(normalizedValue)) {
            return Dificultad.MEDIA;
        }

        if ("EPICA".equals(normalizedValue)) {
            return Dificultad.DIFICIL;
        }

        try {
            return Dificultad.valueOf(normalizedValue);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Valor de dificultad no reconocido en la base de datos: " + dbData, ex);
        }
    }
}
