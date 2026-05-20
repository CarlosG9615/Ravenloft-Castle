package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pocion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pocion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "recuperacion_salud", nullable = false)
    private int recuperacionSalud;

    @Column(name = "recuperacion_mana", nullable = false)
    private int recuperacionMana;

    @Column(nullable = false, length = 50)
    private String rareza;

    @Column(name = "precio_po", nullable = false)
    private int precioPo;
}


