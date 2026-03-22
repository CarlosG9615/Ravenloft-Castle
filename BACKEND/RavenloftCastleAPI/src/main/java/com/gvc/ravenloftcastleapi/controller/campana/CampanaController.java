package com.gvc.ravenloftcastleapi.controller.campana;

import com.gvc.ravenloftcastleapi.dto.campana.CampanaCreateDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CodigoInvitacionDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaUpdateDTO;
import com.gvc.ravenloftcastleapi.service.CampanaService;
import com.gvc.ravenloftcastleapi.service.JoinService;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campanas")
@RequiredArgsConstructor
public class CampanaController {

    private final CampanaService campanaService;
    private final JoinService joinService;

    @PostMapping
    public ResponseEntity<CampanaDetalleDTO> crearCampana(@Valid @RequestBody CampanaCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(campanaService.crearCampana(dto));
    }

    @PutMapping("/{id}/codigo-invitacion")
    public ResponseEntity<String> actualizarCodigoInvitacion(@PathVariable Long id, @Valid @RequestBody CodigoInvitacionDTO dto) {
        String nuevoCodigo = campanaService.actualizarCodigoInvitacion(id, dto.getCodigo());
        return ResponseEntity.ok(nuevoCodigo);
    }


    @GetMapping("/{id}")
    public ResponseEntity<CampanaDetalleDTO> obtenerCampana(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.obtenerCampanaPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampanaDetalleDTO> actualizarCampana(@PathVariable Long id, @Valid @RequestBody CampanaUpdateDTO dto) {
        return ResponseEntity.ok(campanaService.actualizarCampana(id, dto));
    }

    @GetMapping
    public ResponseEntity<List<CampanaDetalleDTO>> obtenerCampanasPublicas() {
        return ResponseEntity.ok(campanaService.listarCampanasPublicas());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCampana(@PathVariable Long id) {
        campanaService.eliminarCampana(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/salir")
    public ResponseEntity<String> salirDeCampana(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        joinService.salirDeCampana(email, id);
        return ResponseEntity.ok("Has salido de la campaña correctamente");
    }

    @GetMapping("/{id}/jugadores")
    public ResponseEntity<List<PersonajeResponseDTO>> listarJugadoresDeCampana(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.listarJugadoresDeCampana(id));
    }
}
