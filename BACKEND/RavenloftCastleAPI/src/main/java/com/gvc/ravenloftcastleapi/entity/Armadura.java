package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "armadura")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Armadura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "ca_base", nullable = false)
    private int caBase;

    @Column(name = "max_dex_bonus", nullable = false)
    private int maxDexBonus;

    @Column(name = "bonus_defensa", nullable = false)
    private int bonusDefensa;

    @Column(nullable = false, length = 50)
    private String rareza;

    @Column(name = "tipo_permitido", nullable = false, length = 100)
    private String tipoPermitido;

    @Column(name = "nivel_min", nullable = false)
    private int nivelMin;

    @Column(name = "requiere_fuerza", nullable = false)
    private int requiereFuerza;

    @Column(name = "sigilo_desventaja", nullable = false)
    private boolean sigiloDesventaja;
}


