package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "habilidad")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habilidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id", nullable = false, unique = true)
    private Personaje personaje;

    @Column(nullable = false)
    private int atletismo;

    @Column(nullable = false)
    private int sigilo;

    @Column(nullable = false)
    private int persuasion;

    @Column(nullable = false)
    private int percepcion;

    @Column(nullable = false)
    private int arcanos;

    @Column(nullable = false)
    private int medicina;

    @Column(nullable = false)
    private int supervivencia;

    @Column(nullable = false)
    private int intimidad;

    @Column(name = "acrobacias")
    private Integer acrobacias;

    @Column(name = "engañar")
    private Integer enganar;

    @Column(name = "historia")
    private Integer historia;

    @Column(name = "interpretacion")
    private Integer interpretacion;

    @Column(name = "investigacion")
    private Integer investigacion;

    @Column(name = "juego_de_manos")
    private Integer juegoDeManos;

    @Column(name = "naturaleza")
    private Integer naturaleza;

    @Column(name = "perspicacia")
    private Integer perspicacia;

    @Column(name = "religion")
    private Integer religion;

    @Column(name = "trato_con_animales")
    private Integer tratoConAnimales;
}
