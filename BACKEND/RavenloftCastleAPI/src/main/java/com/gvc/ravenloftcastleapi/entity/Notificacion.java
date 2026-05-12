package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destino_id", nullable = false)
    private Usuario usuarioDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_origen_id")
    private Usuario usuarioOrigen;

    @Column(nullable = false, length = 50)
    private String tipo; // UNION_CAMPANA, SEGUIMIENTO

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Column(name = "leida", nullable = false)
    private boolean leida = false;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "campana_id")
    private Long campanaId;

    @Column(name = "campana_nombre", length = 150)
    private String campanaNombre;

    @PrePersist
    protected void onCreate() {
        this.fecha = LocalDateTime.now();
    }
}
