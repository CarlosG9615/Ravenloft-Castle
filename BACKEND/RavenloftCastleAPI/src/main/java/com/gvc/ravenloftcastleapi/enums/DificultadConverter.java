package com.gvc.ravenloftcastleapi.enums;

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
        return Dificultad.fromDatabaseValue(dbData);
    }
}
