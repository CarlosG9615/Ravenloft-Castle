package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "arma")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Arma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "damage_dice", nullable = false, length = 20)
    private String damageDice;

    @Column(name = "tipo_daño", nullable = false, length = 50)
    private String tipoDano;

    @Column(name = "bonus_ataque", nullable = false)
    private int bonusAtaque;

    @Column(name = "bonus_daño", nullable = false)
    private int bonusDano;

    @Column(nullable = false, length = 50)
    private String rareza;

    @Column(name = "tipo_permitido", nullable = false, length = 100)
    private String tipoPermitido;

    @Column(name = "nivel_min", nullable = false)
    private int nivelMin;

    @Column(length = 200)
    private String propiedades;
}


