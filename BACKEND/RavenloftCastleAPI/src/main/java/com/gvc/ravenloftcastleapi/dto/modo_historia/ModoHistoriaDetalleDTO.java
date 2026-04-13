package com.gvc.ravenloftcastleapi.dto.modo_historia;

import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioResponseDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionResumenDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.enums.Dificultad;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModoHistoriaDetalleDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private Dificultad dificultad;
    private int nivelMinimo;
    private int maxJugadores;
    private TipoSuscripcion nivelAcceso;
    private boolean active;
    private UsuarioResponseDTO master;
    private List<PersonajeResponseDTO> personajes;
    private List<MisionResumenDTO> misiones;
}

