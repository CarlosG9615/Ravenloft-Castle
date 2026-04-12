package com.gvc.ravenloftcastleapi.entity;

import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "modo_historia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModoHistoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDate fechaCreacion;

    @Column(nullable = false, length = 50)
    private String dificultad;

    @Column(name = "nivel_minimo", nullable = false)
    private int nivelMinimo;

    @Column(name = "max_jugadores", nullable = false)
    private int maxJugadores;

    @Column(nullable = false, length = 100)
    private String sistema;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "nivel_acceso", nullable = false, length = 50)
    private TipoSuscripcion nivelAcceso;

    @Column(name = "codigo_invitacion", unique = true, length = 100)
    private String codigoInvitacion;

    @OneToMany(mappedBy = "modoHistoria", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModoHistoriaEnemigo> enemigos;

    @OneToMany(mappedBy = "modoHistoria", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModoHistoriaPersonaje> personajes;

    @OneToMany(mappedBy = "modoHistoria", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Mision> misiones;

    @OneToMany(mappedBy = "modoHistoria", cascade = CascadeType.ALL)
    private List<TiradaDado> tiradas;
}

