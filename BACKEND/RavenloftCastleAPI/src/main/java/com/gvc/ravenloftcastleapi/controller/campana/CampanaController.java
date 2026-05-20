package com.gvc.ravenloftcastleapi.controller.campana;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gvc.ravenloftcastleapi.dto.CampanaRequest;
import com.gvc.ravenloftcastleapi.dto.CampanaResponse;
import com.gvc.ravenloftcastleapi.service.CampanaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/campanas")
@RequiredArgsConstructor
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
    public ResponseEntity<CampanaResponse> obtenerCampana(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.obtenerCampana(id));
    }

    @PostMapping("/{id}/unirse")
    public ResponseEntity<Void> unirseACampana(
            @PathVariable Long id,
            @RequestParam(required = false) Long personajeId) {
        campanaService.unirseACampana(id, personajeId);
        return ResponseEntity.ok().build();
    }

}