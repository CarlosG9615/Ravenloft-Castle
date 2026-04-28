package com.gvc.ravenloftcastleapi.controller.campana;

import com.gvc.ravenloftcastleapi.dto.CampanaRequest;
import com.gvc.ravenloftcastleapi.dto.CampanaResponse;
import com.gvc.ravenloftcastleapi.service.CampanaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campanas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CampanaController {

    private final CampanaService campanaService;

    @PostMapping
    public ResponseEntity<CampanaResponse> crearCampana(@RequestBody CampanaRequest request) {
        return ResponseEntity.ok(campanaService.crearCampana(request));
    }

    @GetMapping("/mis-campanas")
    public ResponseEntity<List<CampanaResponse>> obtenerMisCampanas() {
        return ResponseEntity.ok(campanaService.obtenerMisCampanas());
    }

    @GetMapping
    public ResponseEntity<List<CampanaResponse>> obtenerCampanasActivas() {
        return ResponseEntity.ok(campanaService.obtenerCampanasActivas());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCampana(@PathVariable Long id) {
        campanaService.eliminarCampana(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampanaResponse> obtenerCampanaPorId(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.obtenerCampanaPorId(id));
    }
}