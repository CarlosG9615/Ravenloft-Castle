package com.gvc.ravenloftcastleapi.controller.inventario;

import com.gvc.ravenloftcastleapi.dto.inventario.AddItemInventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.InventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.UpdateInventarioItemDTO;
import com.gvc.ravenloftcastleapi.service.InventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@RequestMapping("/api/misiones/{misionId}/inventario")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class InventarioController {

    private final InventarioService inventarioService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/personajes/{personajeId}")
    public ResponseEntity<InventarioDTO> getInventarioPersonaje(@PathVariable Long misionId, @PathVariable Long personajeId) {
        return ResponseEntity.ok(inventarioService.listarInventarioPersonaje(getCurrentUserEmail(), misionId, personajeId));
    }

    @GetMapping
    public ResponseEntity<List<InventarioDTO>> getInventariosMision(@PathVariable Long misionId) {
        return ResponseEntity.ok(inventarioService.listarInventariosMision(getCurrentUserEmail(), misionId));
    }

    @PostMapping("/recibir")
    public ResponseEntity<InventarioDTO> recibirItem(@PathVariable Long misionId, @Valid @RequestBody AddItemInventarioDTO dto) {
        return ResponseEntity.ok(inventarioService.recibirItem(getCurrentUserEmail(), misionId, dto));
    }

    @PutMapping("/{inventarioId}")
    public ResponseEntity<InventarioDTO> updateItem(
            @PathVariable Long misionId,
            @PathVariable Long inventarioId,
            @Valid @RequestBody UpdateInventarioItemDTO dto
    ) {
        return ResponseEntity.ok(inventarioService.actualizarItem(getCurrentUserEmail(), misionId, inventarioId, dto));
    }

    @DeleteMapping("/{inventarioId}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long misionId, @PathVariable Long inventarioId) {
        inventarioService.eliminarItem(getCurrentUserEmail(), misionId, inventarioId);
        return ResponseEntity.noContent().build();
    }
}

