package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "enemigos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enemigo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal cr;

    @Column(nullable = false)
    private int salud;

    @Column(nullable = false)
    private int ca;

    @Column(nullable = false)
    private int str;

    @Column(nullable = false)
    private int dex;

    @Column(nullable = false)
    private int con;

    @Column(nullable = false)
    private int ing;

    @Column(nullable = false)
    private int wis;

    @Column(nullable = false)
    private int cha;

    @Column(name = "fuerza_ataque", nullable = false)
    private int fuerzaAtaque;

    @Column(name = "daño_ataque", nullable = false, length = 20)
    private String danoAtaque;

    @Column(columnDefinition = "TEXT")
    private String descripcion;
}


