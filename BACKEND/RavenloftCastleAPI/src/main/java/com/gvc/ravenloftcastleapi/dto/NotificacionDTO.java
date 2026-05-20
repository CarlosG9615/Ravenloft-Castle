package com.gvc.ravenloftcastleapi.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificacionDTO {
    private Long id;
    private String tipo;
    private String mensaje;
    private boolean leida;
    private LocalDateTime fecha;
    private Long campanaId;
    private String campanaNombre;
    private String usuarioOrigenNombre;
    private String usuarioOrigenAvatar;
}
