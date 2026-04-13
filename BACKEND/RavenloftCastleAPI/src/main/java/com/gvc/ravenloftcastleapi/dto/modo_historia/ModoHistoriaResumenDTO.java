package com.gvc.ravenloftcastleapi.dto.modo_historia;

import com.gvc.ravenloftcastleapi.enums.Dificultad;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModoHistoriaResumenDTO {

    private Long id;
    private String nombre;
    private Dificultad dificultad;
    private String master;
    private int jugadoresActuales;
    private int maxJugadores;
    private boolean active;
}
