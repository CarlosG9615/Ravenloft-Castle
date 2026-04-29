package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dice_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiceResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 10)
    private String diceType; // d4, d6, d8, d10, d12, d20, d100

    @Column(nullable = false)
    private Integer quantity; // Cantidad de dados lanzados

    @Column(nullable = false)
    private Integer result; // Resultado de un dado individual

    @Column(nullable = false)
    private Integer total; // Suma total de todos los dados

    @Column(name = "game_id")
    private Long gameId; // ID de la partida

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
