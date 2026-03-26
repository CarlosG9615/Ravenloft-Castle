package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "habilidad")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habilidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id", nullable = false, unique = true)
    private Personaje personaje;

    @Column(nullable = false)
    private int atletismo;

    @Column(nullable = false)
    private int sigilo;

    @Column(nullable = false)
    private int persuasion;

    @Column(nullable = false)
    private int percepcion;

    @Column(nullable = false)
    private int arcanos;

    @Column(nullable = false)
    private int medicina;

    @Column(nullable = false)
    private int supervivencia;

    @Column(nullable = false)
    private int intimidacion;
}


