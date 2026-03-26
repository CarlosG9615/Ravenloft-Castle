package com.gvc.ravenloftcastleapi.dto.campana;

import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaCreateDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    
    private String descripcion;
    
    @NotBlank(message = "La dificultad es obligatoria")
    private String dificultad;
    
    @NotNull(message = "El nivel mínimo es obligatorio")
    private Integer nivelMinimo;
    
    @NotNull(message = "El máximo de jugadores es obligatorio")
    private Integer maxJugadores;
    
    @NotBlank(message = "El sistema es obligatorio")
    private String sistema;
    
    @NotNull(message = "El nivel de acceso es obligatorio")
    private TipoSuscripcion nivelAcceso;
    
    private boolean active;
}
