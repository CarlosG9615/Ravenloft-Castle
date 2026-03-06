package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "mision")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campana_id", nullable = false)
    private Campana campana;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    private int orden;

    @Column(nullable = false, length = 50)
    private String dificultad;

    @Column(name = "xp_recompensa", nullable = false)
    private int xpRecompensa;

    @Column(nullable = false)
    private boolean completada;

    @OneToMany(mappedBy = "mision", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MisionEscenario> escenarios;
}


