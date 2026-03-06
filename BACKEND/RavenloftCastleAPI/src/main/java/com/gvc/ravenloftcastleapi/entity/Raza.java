package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "raza")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Raza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "bonus_str", nullable = false)
    private int bonusStr;

    @Column(name = "bonus_dex", nullable = false)
    private int bonusDex;

    @Column(name = "bonus_con", nullable = false)
    private int bonusCon;

    @Column(name = "bonus_ing", nullable = false)
    private int bonusIng;

    @Column(name = "bonus_wis", nullable = false)
    private int bonusWis;

    @Column(name = "bonus_cha", nullable = false)
    private int bonusCha;

    @Column(nullable = false)
    private int velocidad;

    @OneToMany(mappedBy = "raza")
    private List<Personaje> personajes;
}


