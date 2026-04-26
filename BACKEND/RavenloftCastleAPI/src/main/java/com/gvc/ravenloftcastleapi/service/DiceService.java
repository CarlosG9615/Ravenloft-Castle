package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.dice.DiceHistoryDTO;
import com.gvc.ravenloftcastleapi.dto.dice.DiceRollRequestDTO;
import com.gvc.ravenloftcastleapi.dto.dice.DiceRollResponseDTO;
import com.gvc.ravenloftcastleapi.entity.DiceResult;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.DiceResultRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiceService {

    private final DiceResultRepository diceResultRepository;
    private final UsuarioRepository usuarioRepository;
    private final Random random = new Random();

    /**
     * Valida y guarda un resultado de tirada de dados
     */
    public DiceRollResponseDTO saveDiceRoll(Long usuarioId, DiceRollRequestDTO request) {
        // Validar que el usuario existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Validar que el tipo de dado es válido
        validarTipoDado(request.diceType());

        // Validar que el resultado está dentro del rango permitido
        validarResultado(request.diceType(), request.result());

        // Validar que el total es consistente
        validarTotal(request.diceType(), request.quantity(), request.total());

        // Crear y guardar el resultado
        DiceResult diceResult = DiceResult.builder()
                .usuario(usuario)
                .diceType(request.diceType())
                .quantity(request.quantity())
                .result(request.result())
                .total(request.total())
                .gameId(request.gameId())
                .build();

        DiceResult saved = diceResultRepository.save(diceResult);

        return convertToResponseDTO(saved);
    }

    /**
     * Genera un número aleatorio para un tipo de dado específico
     */
    public Integer generateRandomDiceResult(String diceType) {
        validarTipoDado(diceType);

        int maxValue = extraerMaximoDado(diceType);
        return random.nextInt(maxValue) + 1;
    }

    /**
     * Genera múltiples tiradas (ej: 2d20)
     */
    public Integer generateMultipleDiceRolls(String diceType, Integer quantity) {
        validarTipoDado(diceType);

        if (quantity < 1 || quantity > 100) {
            throw new IllegalArgumentException("Cantidad de dados debe estar entre 1 y 100");
        }

        int maxValue = extraerMaximoDado(diceType);
        int total = 0;

        for (int i = 0; i < quantity; i++) {
            total += random.nextInt(maxValue) + 1;
        }

        return total;
    }

    /**
     * Obtiene el historial de tiradas de un usuario
     */
    public DiceHistoryDTO getUserDiceHistory(Long usuarioId) {
        List<DiceResult> rolls = diceResultRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId);
        List<DiceRollResponseDTO> dtoList = rolls.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());

        return new DiceHistoryDTO(
                usuarioId,
                dtoList,
                dtoList.size(),
                null,
                null
        );
    }

    /**
     * Obtiene el historial de tiradas de un usuario en una partida específica
     */
    public DiceHistoryDTO getUserDiceHistoryByGame(Long usuarioId, Long gameId) {
        List<DiceResult> rolls = diceResultRepository.findByUsuarioIdAndGameIdOrderByCreatedAtDesc(usuarioId, gameId);
        List<DiceRollResponseDTO> dtoList = rolls.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());

        return new DiceHistoryDTO(
                usuarioId,
                dtoList,
                dtoList.size(),
                null,
                null
        );
    }

    /**
     * Obtiene el historial de tiradas por rango de fechas
     */
    public DiceHistoryDTO getUserDiceHistoryByDateRange(Long usuarioId, LocalDateTime startDate, LocalDateTime endDate) {
        List<DiceResult> rolls = diceResultRepository.findByUsuarioIdAndDateRange(usuarioId, startDate, endDate);
        List<DiceRollResponseDTO> dtoList = rolls.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());

        return new DiceHistoryDTO(
                usuarioId,
                dtoList,
                dtoList.size(),
                startDate,
                endDate
        );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Métodos privados de validación
    // ────────────────────────────────────────────────────────────────────────────

    private void validarTipoDado(String diceType) {
        List<String> validDices = List.of("d4", "d6", "d8", "d10", "d12", "d20", "d100");
        if (!validDices.contains(diceType.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de dado no válido. Tipos permitidos: " + validDices);
        }
    }

    private int extraerMaximoDado(String diceType) {
        return switch (diceType.toLowerCase()) {
            case "d4" -> 4;
            case "d6" -> 6;
            case "d8" -> 8;
            case "d10" -> 10;
            case "d12" -> 12;
            case "d20" -> 20;
            case "d100" -> 100;
            default -> throw new IllegalArgumentException("Tipo de dado desconocido: " + diceType);
        };
    }

    private void validarResultado(String diceType, Integer result) {
        int maxValue = extraerMaximoDado(diceType);
        if (result < 1 || result > maxValue) {
            throw new IllegalArgumentException("El resultado debe estar entre 1 y " + maxValue + " para " + diceType);
        }
    }

    private void validarTotal(String diceType, Integer quantity, Integer total) {
        int maxValue = extraerMaximoDado(diceType);
        int minTotal = quantity; // mínimo 1 por cada dado
        int maxTotal = maxValue * quantity;

        if (total < minTotal || total > maxTotal) {
            throw new IllegalArgumentException(
                    "El total debe estar entre " + minTotal + " y " + maxTotal +
                    " para " + quantity + "x" + diceType
            );
        }
    }

    private DiceRollResponseDTO convertToResponseDTO(DiceResult diceResult) {
        return new DiceRollResponseDTO(
                diceResult.getId(),
                diceResult.getDiceType(),
                diceResult.getQuantity(),
                diceResult.getResult(),
                diceResult.getTotal(),
                diceResult.getGameId(),
                diceResult.getCreatedAt()
        );
    }
}
