package com.gvc.ravenloftcastleapi.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TipoSuscripcionConverter implements AttributeConverter<TipoSuscripcion, String> {

    @Override
    public String convertToDatabaseColumn(TipoSuscripcion attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public TipoSuscripcion convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        // Convierte a mayúsculas antes de buscar el enum para evitar errores con "basica" vs "BASICA"
        try {
            return TipoSuscripcion.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            // Opcional: Loguear advertencia
            System.err.println("ADVERTENCIA: Valor desconocido en base de datos para TipoSuscripcion: " + dbData);
            throw e;
        }
    }
}

