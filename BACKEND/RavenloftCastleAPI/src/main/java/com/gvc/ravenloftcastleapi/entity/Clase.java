package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "clase")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "dado_golpe", nullable = false)
    private int dadoGolpe;

    @Column(name = "stat_principal", nullable = false, length = 10)
    private String statPrincipal;

    @Column(name = "armadura_permitida", nullable = false, length = 100)
    private String armaduraPermitida;

    @Column(name = "caracteristica_clase", columnDefinition = "TEXT")
    private String caracteristicaClase;

    @OneToMany(mappedBy = "clase")
    private List<Personaje> personajes;
}


