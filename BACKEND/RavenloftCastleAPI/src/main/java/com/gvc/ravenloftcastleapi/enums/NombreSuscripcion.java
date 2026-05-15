package com.gvc.ravenloftcastleapi.enums;

public enum NombreSuscripcion {
    HEROE(TipoSuscripcion.BASICA),
    DUNGEON_MASTER(TipoSuscripcion.PREMIUM),
    ARCHIMAGO(TipoSuscripcion.VIP);

    private final TipoSuscripcion tipo;

    NombreSuscripcion(TipoSuscripcion tipo) {
        this.tipo = tipo;
    }

    public TipoSuscripcion getTipo() {
        return tipo;
    }

    public static NombreSuscripcion fromTipo(TipoSuscripcion tipo) {
        for (NombreSuscripcion nombre : values()) {
            if (nombre.tipo == tipo) {
                return nombre;
            }
        }
        throw new IllegalArgumentException("No existe nombre para el tipo: " + tipo);
    }
}
