package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "modo_historia_personaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModoHistoriaPersonaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modo_historia_id", nullable = false)
    private ModoHistoria modoHistoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id", nullable = false)
    private Personaje personaje;

    @Column(name = "fecha_union", nullable = false)
    private LocalDate fechaUnion;
}



