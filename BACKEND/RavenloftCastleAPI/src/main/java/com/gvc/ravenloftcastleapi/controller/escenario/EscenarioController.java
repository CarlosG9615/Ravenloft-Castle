package com.gvc.ravenloftcastleapi.controller.escenario;

import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioDTO;
import com.gvc.ravenloftcastleapi.service.EscenarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/escenarios")
@RequiredArgsConstructor
public class EscenarioController {

    private final EscenarioService escenarioService;

    @GetMapping
    public ResponseEntity<List<EscenarioDTO>> getAllEscenarios() {
        return ResponseEntity.ok(escenarioService.getAllEscenarios());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EscenarioDTO> getEscenarioById(@PathVariable Long id) {
        return ResponseEntity.ok(escenarioService.getEscenarioById(id));
    }
}
