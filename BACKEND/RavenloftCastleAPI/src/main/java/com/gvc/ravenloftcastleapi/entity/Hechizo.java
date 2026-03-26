package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hechizo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hechizo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "nivel_hechizo", nullable = false)
    private int nivelHechizo;

    @Column(nullable = false, length = 50)
    private String escuela;

    @Column(name = "damage_dice", length = 20)
    private String damageDice;

    @Column(name = "tipo_daño", length = 50)
    private String tipoDano;

    @Column(name = "coste_mana", nullable = false)
    private int costeMana;

    @Column(nullable = false, length = 50)
    private String rareza;

    @Column(name = "tipo_permitido", nullable = false, length = 100)
    private String tipoPermitido;

    @Column(name = "nivel_min", nullable = false)
    private int nivelMin;

    @Column(nullable = false, length = 50)
    private String alcance;

    @Column(nullable = false, length = 50)
    private String duracion;
}


