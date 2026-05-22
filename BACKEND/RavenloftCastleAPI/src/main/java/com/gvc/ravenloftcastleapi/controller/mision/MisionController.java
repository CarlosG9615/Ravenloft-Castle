package com.gvc.ravenloftcastleapi.controller.mision;

import com.gvc.ravenloftcastleapi.dto.mision.MisionDetalleDTO;
import com.gvc.ravenloftcastleapi.service.MisionService;
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

    @PatchMapping("/{id}/completada")
    public ResponseEntity<Void> marcarComoCompletada(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean completada) {
        misionService.marcarComoCompletada(id, completada);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/config-partida")
    public ResponseEntity<Void> guardarConfigPartida(
            @PathVariable Long id,
            @RequestBody String configPartida) {
        try {
            misionService.guardarConfigPartida(id, configPartida);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}/config-partida")
    public ResponseEntity<String> obtenerConfigPartida(@PathVariable Long id) {
        try {
            String configJson = misionService.obtenerConfigPartida(id);
            if (configJson == null || configJson.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(configJson);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
