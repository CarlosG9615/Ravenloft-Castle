package com.gvc.ravenloftcastleapi.dto.personaje;

public class PersonajeCreateDTO {

    public String nombre;
    public Long razaId;
    public Long claseId;
    public int str;
    public int dex;
    public int con;
    public int ing;
    public int wis;
    public int cha;
    public String alineamiento; // -> (CARACTER, NEUTRAL, MALVADO, ETC)

    public PersonajeCreateDTO() {}

    // getters/setters opcionales si se desea
}
