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
    private int puntosGolpeMax;

    @Column(name = "salud_actual", nullable = false)
    private int puntosGolpeActual;

    @Column(name = "str", nullable = false)
    private int fuerza;

    @Column(name = "dex", nullable = false)
    private int destreza;

    @Column(name = "con", nullable = false)
    private int constitucion;

    @Column(name = "ing", nullable = false)
    private int inteligencia;

    @Column(name = "wis", nullable = false)
    private int sabiduria;

    @Column(name = "cha", nullable = false)
    private int carisma;

    @Column(name = "clase_armadura", nullable = false)
    private int claseArmadura;

    @Column(nullable = false)
    private int iniciativa;

    @Column(nullable = false)
    private int velocidad;

    @Column(name = "bonif_competencia", nullable = false)
    private int bonificacionCompetencia;

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
