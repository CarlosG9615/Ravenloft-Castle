package com.gvc.ravenloftcastleapi.entity;

import com.gvc.ravenloftcastleapi.enums.TipoGuardadoProgreso;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "mision_progreso")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MisionProgreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mision_id", nullable = false)
    private Mision mision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id", nullable = false)
    private Personaje personaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mision_escenario_id")
    private MisionEscenario misionEscenario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_guardado", nullable = false, length = 20)
    private TipoGuardadoProgreso tipoGuardado;

    @Column(name = "numero_guardado", nullable = false)
    private Integer numeroGuardado;

    @Column(name = "nombre_guardado", length = 120)
    private String nombreGuardado;

    @Column(name = "descripcion_guardado", length = 255)
    private String descripcionGuardado;

    @Column(name = "estado_json", nullable = false, columnDefinition = "json")
    private String estadoJson;

    @Column(name = "resumen_json", columnDefinition = "json")
    private String resumenJson;

    @Column(name = "ultima_tirada_json", columnDefinition = "json")
    private String ultimaTiradaJson;

    @Column(name = "checkpoint_actual", length = 150)
    private String checkpointActual;

    @Column(name = "porcentaje_avance", precision = 5, scale = 2)
    private BigDecimal porcentajeAvance;

    @Column(name = "es_recuperable", nullable = false)
    private boolean esRecuperable;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @OneToMany(mappedBy = "misionProgreso")
    private List<TiradaDado> tiradas;

    @PrePersist
    public void onCreate() {
        LocalDateTime ahora = LocalDateTime.now();
        if (creadoEn == null) {
            creadoEn = ahora;
        }
        actualizadoEn = ahora;
    }

    @PreUpdate
    public void onUpdate() {
        actualizadoEn = LocalDateTime.now();
    }
}

