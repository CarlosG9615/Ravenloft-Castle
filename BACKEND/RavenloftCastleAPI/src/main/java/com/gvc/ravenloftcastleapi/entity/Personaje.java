package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "personaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Personaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raza_id", nullable = false)
    private Raza raza;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clase_id", nullable = false)
    private Clase clase;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private int nivel;

    @Column(nullable = false)
    private int experiencia;

    @Column(name = "salud_max", nullable = false)
    private int saludMax;

    @Column(name = "salud_actual", nullable = false)
    private int saludActual;

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

    @Column(length = 50)
    private String alineamiento;

    @OneToOne(mappedBy = "personaje", cascade = CascadeType.ALL, orphanRemoval = true)
    private Habilidad habilidad;

    @OneToMany(mappedBy = "personaje", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Inventario> inventario;

    @OneToMany(mappedBy = "personaje", cascade = CascadeType.ALL)
    private List<TiradaDado> tiradas;

    @OneToMany(mappedBy = "personaje", cascade = CascadeType.ALL)
    private List<CampanaPersonaje> campanas;
}


