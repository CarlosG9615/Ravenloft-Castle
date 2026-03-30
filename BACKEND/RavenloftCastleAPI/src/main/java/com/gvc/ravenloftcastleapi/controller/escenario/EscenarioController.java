package com.gvc.ravenloftcastleapi.controller.escenario;

import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioDTO;
import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioCreateDTO;
import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioUpdateDTO;
import com.gvc.ravenloftcastleapi.service.EscenarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscenarioDTO> crearEscenario(@Valid @RequestBody EscenarioCreateDTO dto) {
        EscenarioDTO nuevoEscenario = escenarioService.crearEscenario(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoEscenario);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscenarioDTO> actualizarEscenario(
            @PathVariable Long id,
            @RequestBody EscenarioUpdateDTO dto) {
        return ResponseEntity.ok(escenarioService.actualizarEscenario(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarEscenario(@PathVariable Long id) {
        escenarioService.eliminarEscenario(id);
        return ResponseEntity.noContent().build();
    }
}
