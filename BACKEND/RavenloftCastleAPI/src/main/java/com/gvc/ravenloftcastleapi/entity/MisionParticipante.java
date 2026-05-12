package com.gvc.ravenloftcastleapi.entity;

import java.time.LocalDateTime;

import com.gvc.ravenloftcastleapi.enums.RolParticipante;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mision_participante", uniqueConstraints = {@UniqueConstraint(columnNames = {"mision_id", "usuario_id"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MisionParticipante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mision_id", nullable = false)
    private Mision mision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id")
    private Personaje personaje;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolParticipante rol;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "token_col")
    private Integer tokenCol;

    @Column(name = "token_row")
    private Integer tokenRow;

    @Column(name = "orden_union")
    private Integer ordenUnion;

    @Column(name = "movimiento_roll")
    private Integer movimientoRoll;

    @Column(name = "ataque_roll")
    private Integer ataqueRoll;
}
