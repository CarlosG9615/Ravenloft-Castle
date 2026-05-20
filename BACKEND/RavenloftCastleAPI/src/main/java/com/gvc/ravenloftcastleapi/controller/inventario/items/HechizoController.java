package com.gvc.ravenloftcastleapi.controller.inventario.items;

import com.gvc.ravenloftcastleapi.dto.inventario.HechizoDTO;
import com.gvc.ravenloftcastleapi.service.CatalogoItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/inventario/items/hechizos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class HechizoController {

    private final CatalogoItemService catalogoItemService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<HechizoDTO>> list() {
        return ResponseEntity.ok(catalogoItemService.listarHechizos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HechizoDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogoItemService.getHechizo(id));
    }

    @PostMapping
    public ResponseEntity<HechizoDTO> create(@Valid @RequestBody HechizoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoItemService.crearHechizo(getCurrentUserEmail(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HechizoDTO> update(@PathVariable Long id, @Valid @RequestBody HechizoDTO dto) {
        return ResponseEntity.ok(catalogoItemService.actualizarHechizo(getCurrentUserEmail(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        catalogoItemService.eliminarHechizo(getCurrentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }
}


