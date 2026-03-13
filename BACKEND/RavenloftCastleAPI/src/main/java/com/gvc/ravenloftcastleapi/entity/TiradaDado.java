package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tirada_dado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TiradaDado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id", nullable = false)
    private Personaje personaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campana_id", nullable = false)
    private Campana campana;

    @Column(name = "tipo_tirada", nullable = false, length = 50)
    private String tipoTirada;

    @Column(nullable = false, length = 10)
    private String dado;

    @Column(name = "resultado_dado", nullable = false)
    private int resultadoDado;

    @Column(nullable = false)
    private int modificador;

    @Column(name = "resultado_final", nullable = false)
    private int resultadoFinal;

    @Column(nullable = false)
    private boolean ventaja;

    @Column(length = 255)
    private String descripcion;

    @Column(nullable = false)
    private LocalDateTime fecha;
}


