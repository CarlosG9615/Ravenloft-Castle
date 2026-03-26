package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id", nullable = false)
    private Personaje personaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arma_id")
    private Arma arma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "armadura_id")
    private Armadura armadura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hechizo_id")
    private Hechizo hechizo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pocion_id")
    private Pocion pocion;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false)
    private boolean equipado;

    @Column(nullable = false)
    private int cantidad;
}


