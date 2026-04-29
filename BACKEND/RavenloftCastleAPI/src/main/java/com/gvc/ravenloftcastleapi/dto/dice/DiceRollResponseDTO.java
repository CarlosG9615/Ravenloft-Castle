package com.gvc.ravenloftcastleapi.dto.dice;

import java.time.LocalDateTime;

public record DiceRollResponseDTO(
        Long id,
        String diceType,
        Integer quantity,
        Integer result,
        Integer total,
        Long gameId,
        LocalDateTime createdAt
) {}
