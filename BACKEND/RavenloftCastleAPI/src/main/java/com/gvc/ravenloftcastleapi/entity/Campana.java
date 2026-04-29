package com.gvc.ravenloftcastleapi.entity;

import com.gvc.ravenloftcastleapi.enums.EstadoCampana;
import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "dificultad", length = 50)
    private String dificultad;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "codigo_invitacion", length = 100, unique = true)
    private String codigoInvitacion;

    @Column(name = "max_jugadores", nullable = false)
    private Integer maxJugadores;

    @Column(name = "num_sesiones", nullable = false)
    private Integer numSesiones;

    @Column(nullable = false, length = 100)
    private String sistema;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoCampana estado;

    @Column(columnDefinition = "LONGTEXT")
    private String logo;

    @Column(name = "mapas_seleccionados", columnDefinition = "LONGTEXT")
    private String mapasSeleccionados;

    @Column(columnDefinition = "LONGTEXT")
    private String imagen;

    @ManyToOne
    @JoinColumn(name = "master_id", columnDefinition = "INT UNSIGNED", nullable = false)
    private Usuario master;


}
