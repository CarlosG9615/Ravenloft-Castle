package com.gvc.ravenloftcastleapi.controller.inventario.items;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gvc.ravenloftcastleapi.dto.inventario.ArmaduraDTO;
import com.gvc.ravenloftcastleapi.service.CatalogoItemService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inventario/items/armaduras")
@RequiredArgsConstructor
public class ArmaduraController {

    private final CatalogoItemService catalogoItemService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<ArmaduraDTO>> list() {
        return ResponseEntity.ok(catalogoItemService.listarArmaduras());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArmaduraDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogoItemService.getArmadura(id));
    }

    @PostMapping
    public ResponseEntity<ArmaduraDTO> create(@Valid @RequestBody ArmaduraDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoItemService.crearArmadura(getCurrentUserEmail(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArmaduraDTO> update(@PathVariable Long id, @Valid @RequestBody ArmaduraDTO dto) {
        return ResponseEntity.ok(catalogoItemService.actualizarArmadura(getCurrentUserEmail(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        catalogoItemService.eliminarArmadura(getCurrentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }
}


