package com.gvc.ravenloftcastleapi.dto.personaje;

public class PersonajeCreateDTO {

    String nombre;
    Long razaId;
    Long claseId;
    int str;
    int dex;
    int con;
    int ing;
    int wis;
    int cha;
    String alineamiento; // -> (CARACTER, NEUTRAL, MALVADO, ETC)
}
