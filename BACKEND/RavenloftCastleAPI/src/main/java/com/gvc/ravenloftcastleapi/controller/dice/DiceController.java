package com.gvc.ravenloftcastleapi.controller.dice;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gvc.ravenloftcastleapi.dto.dice.DiceHistoryDTO;
import com.gvc.ravenloftcastleapi.dto.dice.DiceRollRequestDTO;
import com.gvc.ravenloftcastleapi.dto.dice.DiceRollResponseDTO;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import com.gvc.ravenloftcastleapi.service.DiceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dice")
@RequiredArgsConstructor
public class DiceController {

    private final UsuarioRepository usuarioRepository;
    private final DiceService diceService;

    /**
     * Guardar una tirada de dados
     * POST /api/dice/roll
     */
    @PostMapping("/roll")
    public ResponseEntity<DiceRollResponseDTO> rollDice(
            @Valid @RequestBody DiceRollRequestDTO request,
            Authentication authentication) {
        try {
            // Obtener ID del usuario desde el token JWT (Spring Security lo proporciona)
            Long usuarioId = extraerUsuarioIdDelToken(authentication);
            
            DiceRollResponseDTO response = diceService.saveDiceRoll(usuarioId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Generar un número aleatorio para un dado
     * GET /api/dice/generate?diceType=d20
     */
    @GetMapping("/generate")
    public ResponseEntity<Integer> generateRandomDice(
            @RequestParam String diceType) {
        try {
            Integer result = diceService.generateRandomDiceResult(diceType);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Generar múltiples tiradas de dados
     * GET /api/dice/generate-multiple?diceType=d20&quantity=2
     */
    @GetMapping("/generate-multiple")
    public ResponseEntity<Integer> generateMultipleDice(
            @RequestParam String diceType,
            @RequestParam Integer quantity) {
        try {
            Integer total = diceService.generateMultipleDiceRolls(diceType, quantity);
            return ResponseEntity.ok(total);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener historial de tiradas del usuario autenticado
     * GET /api/dice/history
     */
    @GetMapping("/history")
    public ResponseEntity<DiceHistoryDTO> getUserHistory(Authentication authentication) {
        try {
            Long usuarioId = extraerUsuarioIdDelToken(authentication);
            DiceHistoryDTO history = diceService.getUserDiceHistory(usuarioId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener historial de tiradas por partida
     * GET /api/dice/history/game/{gameId}
     */
    @GetMapping("/history/game/{gameId}")
    public ResponseEntity<DiceHistoryDTO> getUserHistoryByGame(
            @PathVariable Long gameId,
            Authentication authentication) {
        try {
            Long usuarioId = extraerUsuarioIdDelToken(authentication);
            DiceHistoryDTO history = diceService.getUserDiceHistoryByGame(usuarioId, gameId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener historial por rango de fechas
     * GET /api/dice/history/range?startDate=2024-01-01T00:00:00&endDate=2024-12-31T23:59:59
     */
    @GetMapping("/history/range")
    public ResponseEntity<DiceHistoryDTO> getUserHistoryByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication authentication) {
        try {
            Long usuarioId = extraerUsuarioIdDelToken(authentication);
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            LocalDateTime start = LocalDateTime.parse(startDate, formatter);
            LocalDateTime end = LocalDateTime.parse(endDate, formatter);
            
            DiceHistoryDTO history = diceService.getUserDiceHistoryByDateRange(usuarioId, start, end);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Extrae el ID del usuario desde el token JWT
     */
    private Long extraerUsuarioIdDelToken(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Usuario no autenticado");
        }
        String email = authentication.getName(); // JwtService guarda el email como subject
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + email));
        return usuario.getId();
    }
}
