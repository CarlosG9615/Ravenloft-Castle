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

import com.gvc.ravenloftcastleapi.dto.inventario.PocionDTO;
import com.gvc.ravenloftcastleapi.service.CatalogoItemService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inventario/items/pociones")
@RequiredArgsConstructor
public class PocionController {

    private final CatalogoItemService catalogoItemService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<PocionDTO>> list() {
        return ResponseEntity.ok(catalogoItemService.listarPociones());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PocionDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogoItemService.getPocion(id));
    }

    @PostMapping
    public ResponseEntity<PocionDTO> create(@Valid @RequestBody PocionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoItemService.crearPocion(getCurrentUserEmail(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PocionDTO> update(@PathVariable Long id, @Valid @RequestBody PocionDTO dto) {
        return ResponseEntity.ok(catalogoItemService.actualizarPocion(getCurrentUserEmail(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        catalogoItemService.eliminarPocion(getCurrentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }
}


