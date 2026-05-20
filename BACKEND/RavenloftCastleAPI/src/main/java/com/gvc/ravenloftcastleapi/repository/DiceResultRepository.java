package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.DiceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DiceResultRepository extends JpaRepository<DiceResult, Long> {

    // Obtener todos los resultados de un usuario
    List<DiceResult> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);

    // Obtener resultados de un usuario en una partida específica
    List<DiceResult> findByUsuarioIdAndGameIdOrderByCreatedAtDesc(Long usuarioId, Long gameId);

    // Obtener resultados de una partida
    List<DiceResult> findByGameIdOrderByCreatedAtDesc(Long gameId);

    // Obtener resultados de un usuario por tipo de dado
    List<DiceResult> findByUsuarioIdAndDiceTypeOrderByCreatedAtDesc(Long usuarioId, String diceType);

    // Obtener resultados por rango de fechas
    @Query("SELECT dr FROM DiceResult dr WHERE dr.usuario.id = :usuarioId AND dr.createdAt BETWEEN :startDate AND :endDate ORDER BY dr.createdAt DESC")
    List<DiceResult> findByUsuarioIdAndDateRange(@Param("usuarioId") Long usuarioId,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
}
