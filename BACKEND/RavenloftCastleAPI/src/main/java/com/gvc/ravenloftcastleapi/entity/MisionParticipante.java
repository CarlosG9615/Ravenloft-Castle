package com.gvc.ravenloftcastleapi.entity;

import com.gvc.ravenloftcastleapi.enums.RolParticipante;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolParticipante rol;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;
}
