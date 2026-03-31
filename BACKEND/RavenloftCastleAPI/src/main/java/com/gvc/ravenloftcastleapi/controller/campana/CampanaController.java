package com.gvc.ravenloftcastleapi.controller.campana;

import com.gvc.ravenloftcastleapi.dto.campana.CampanaCreateDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CodigoInvitacionDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionResumenDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.CampanaEnemigoDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaEnemigoUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.campana.CampanaEnemigoResponseDTO;
import com.gvc.ravenloftcastleapi.service.CampanaService;
import com.gvc.ravenloftcastleapi.service.JoinService;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autorizado");
        }
        String email = authentication.getName();
        joinService.salirDeCampana(email, id);
        return ResponseEntity.ok("Has salido de la campaña correctamente");
    }

    @GetMapping("/{id}/jugadores")
    public ResponseEntity<List<PersonajeResponseDTO>> listarJugadoresDeCampana(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.listarJugadoresDeCampana(id));
    }

    @GetMapping("/{id}/misiones")
    public ResponseEntity<List<MisionResumenDTO>> listarMisionesDeCampana(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.listarMisionesDeCampana(id));
    }

    @GetMapping("/{id}/enemigos")
    public ResponseEntity<List<CampanaEnemigoResponseDTO>> listarEnemigosDeCampana(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.listarEnemigosDeCampana(id));
    }

    @PostMapping("/{id}/enemigos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> asignarEnemigo(
            @PathVariable Long id,
            @Valid @RequestBody CampanaEnemigoDTO dto) {
        campanaService.asignarEnemigo(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{id}/enemigos/{enemigoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> editarEnemigoCampana(
            @PathVariable Long id,
            @PathVariable Long enemigoId,
            @Valid @RequestBody CampanaEnemigoUpdateDTO dto) {
        campanaService.editarEnemigoCampana(id, enemigoId, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/enemigos/{enemigoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarEnemigoCampana(
            @PathVariable Long id,
            @PathVariable Long enemigoId) {
        campanaService.eliminarEnemigoCampana(id, enemigoId);
        return ResponseEntity.noContent().build();
    }
}
