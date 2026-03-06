package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "mision_escenario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MisionEscenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mision_id", nullable = false)
    private Mision mision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escenario_id", nullable = false)
    private Escenario escenario;

    @Column(nullable = false)
    private int orden;

    @Column(nullable = false)
    private int dificultad;

    @Column(name = "multiplicador_enemigos", nullable = false, precision = 4, scale = 2)
    private BigDecimal multiplicadorEnemigos;
}


