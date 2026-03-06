package com.gvc.ravenloftcastleapi.dto.campana;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionResumenDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResumenDTO;
import java.util.List;
public class CampanaDetalleDTO {
    Long id;
    String nombre;
    String descripcion;
    String dificultad;
    int nivelMinimo;
    int maxJugadores;
    boolean active;
    UsuarioResponseDTO master;
    List<PersonajeResumenDTO> personajes;
    List<MisionResumenDTO> misiones;
}