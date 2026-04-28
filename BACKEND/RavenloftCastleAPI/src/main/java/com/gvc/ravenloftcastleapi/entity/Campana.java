package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "campana")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campana {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "codigo_invitacion", length = 100, unique = true)
    private String codigoInvitacion;

    @Column(name = "fecha_creacion", nullable = false)
    private java.time.LocalDate fechaCreacion;

    @Column(name = "max_jugadores", nullable = false)
    private Integer maxJugadores;


    @Column(nullable = false, length = 100)
    private String sistema;

    @Column(columnDefinition = "LONGTEXT")
    private String logo;

    @Column(columnDefinition = "LONGTEXT")
    private String imagen;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "campana_mapas", joinColumns = @JoinColumn(name = "campana_id", columnDefinition = "INT UNSIGNED"))
    @Column(name = "mapa_ruta")
    private List<String> mapas = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "master_id", columnDefinition = "INT UNSIGNED")
    private Usuario master;


}
