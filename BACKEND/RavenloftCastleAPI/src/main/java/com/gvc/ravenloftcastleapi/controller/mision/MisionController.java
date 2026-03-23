package com.gvc.ravenloftcastleapi.controller.mision;

import com.gvc.ravenloftcastleapi.dto.mision.MisionCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionUpdateDTO;
import com.gvc.ravenloftcastleapi.service.MisionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/misiones")
@RequiredArgsConstructor
public class MisionController {

    private final MisionService misionService;

    @GetMapping("/{id}")
    public ResponseEntity<MisionDetalleDTO> obtenerMision(@PathVariable Long id) {
        return ResponseEntity.ok(misionService.obtenerMisionPorId(id));
    }

    @PostMapping
    public ResponseEntity<MisionDetalleDTO> crearMision(@Valid @RequestBody MisionCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(misionService.crearMision(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MisionDetalleDTO> actualizarMision(
            @PathVariable Long id,
            @Valid @RequestBody MisionUpdateDTO dto) {
        return ResponseEntity.ok(misionService.actualizarMision(id, dto));
    }

    @PatchMapping("/{id}/completada")
    public ResponseEntity<Void> marcarComoCompletada(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean completada) {
        misionService.marcarComoCompletada(id, completada);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarMision(@PathVariable Long id) {
        misionService.eliminarMision(id);
        return ResponseEntity.noContent().build();
    }
}
