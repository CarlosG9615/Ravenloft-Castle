package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "modo_historia_enemigo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModoHistoriaEnemigo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modo_historia_id", nullable = false)
    private ModoHistoria modoHistoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enemigo_id", nullable = false)
    private Enemigo enemigo;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false)
    private int dificultad;
}



