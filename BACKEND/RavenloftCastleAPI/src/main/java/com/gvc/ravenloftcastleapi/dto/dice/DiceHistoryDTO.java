package com.gvc.ravenloftcastleapi.dto.dice;

import java.time.LocalDateTime;
import java.util.List;

public record DiceHistoryDTO(
        Long usuarioId,
        List<DiceRollResponseDTO> rolls,
        Integer totalRolls,
        LocalDateTime fromDate,
        LocalDateTime toDate
) {}
