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

import com.gvc.ravenloftcastleapi.dto.inventario.ArmaDTO;
import com.gvc.ravenloftcastleapi.service.CatalogoItemService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inventario/items/armas")
@RequiredArgsConstructor
public class ArmaController {

    private final CatalogoItemService catalogoItemService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<ArmaDTO>> list() {
        return ResponseEntity.ok(catalogoItemService.listarArmas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArmaDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogoItemService.getArma(id));
    }

    @PostMapping
    public ResponseEntity<ArmaDTO> create(@Valid @RequestBody ArmaDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoItemService.crearArma(getCurrentUserEmail(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArmaDTO> update(@PathVariable Long id, @Valid @RequestBody ArmaDTO dto) {
        return ResponseEntity.ok(catalogoItemService.actualizarArma(getCurrentUserEmail(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        catalogoItemService.eliminarArma(getCurrentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }
}



