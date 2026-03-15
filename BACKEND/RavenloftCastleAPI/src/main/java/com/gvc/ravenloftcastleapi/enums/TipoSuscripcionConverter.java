package com.gvc.ravenloftcastleapi.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.stream.Stream;

@Converter(autoApply = true)
public class TipoSuscripcionConverter implements AttributeConverter<TipoSuscripcion, String> {

    @Override
    public String convertToDatabaseColumn(TipoSuscripcion tipo) {
        if (tipo == null) {
            return null;
        }
        return tipo.name();
    }

    @Override
    public TipoSuscripcion convertToEntityAttribute(String code) {
        if (code == null) {
            return null;
        }

        return Stream.of(TipoSuscripcion.values())
                .filter(t -> t.name().equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo de suscripción desconocido: " + code));
    }
}

