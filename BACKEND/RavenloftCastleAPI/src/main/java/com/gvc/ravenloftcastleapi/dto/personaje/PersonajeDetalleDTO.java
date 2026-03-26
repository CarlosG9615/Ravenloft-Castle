package com.gvc.ravenloftcastleapi.dto.personaje;

import com.gvc.ravenloftcastleapi.dto.catalogo.ClaseResumenDTO;
import com.gvc.ravenloftcastleapi.dto.catalogo.RazaResumenDTO;

public class PersonajeDetalleDTO {

    Long id;
    String nombre;
    int nivel;
    int experiencia;
    int saludMax;
    int saludActual;
    String alineamiento;

    // Raza y clase embebidos (no solo el id)
    RazaResumenDTO raza;
    ClaseResumenDTO clase;

    // Stats
    StatsDTO stats;

    // Habilidades de proficiencia
    HabilidadDTO habilidades;
}
