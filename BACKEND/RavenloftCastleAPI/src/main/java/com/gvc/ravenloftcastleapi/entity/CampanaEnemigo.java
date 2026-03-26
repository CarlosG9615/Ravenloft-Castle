package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "campana_enemigo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampanaEnemigo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campana_id", nullable = false)
    private Campana campana;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enemigo_id", nullable = false)
    private Enemigo enemigo;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false)
    private int dificultad;
}


