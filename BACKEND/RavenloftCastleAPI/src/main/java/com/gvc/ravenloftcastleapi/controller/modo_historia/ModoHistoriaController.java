package com.gvc.ravenloftcastleapi.controller.modo_historia;

import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaCreateDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.CodigoInvitacionDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaUpdateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionResumenDTO;
import com.gvc.ravenloftcastleapi.dto.modo_historia.ModoHistoriaEnemigoResponseDTO;
import com.gvc.ravenloftcastleapi.service.ModoHistoriaService;
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
@RequestMapping("/api/modos-historia")
@RequiredArgsConstructor
public class ModoHistoriaController {

    private final ModoHistoriaService modoHistoriaService;
    private final JoinService joinService;

    @PostMapping
    public ResponseEntity<ModoHistoriaDetalleDTO> crearModoHistoria(@Valid @RequestBody ModoHistoriaCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(modoHistoriaService.crearModoHistoria(dto));
    }

    @PutMapping("/{id}/codigo-invitacion")
    public ResponseEntity<String> actualizarCodigoInvitacion(@PathVariable Long id, @Valid @RequestBody CodigoInvitacionDTO dto) {
        String nuevoCodigo = modoHistoriaService.actualizarCodigoInvitacion(id, dto.getCodigo());
        return ResponseEntity.ok(nuevoCodigo);
    }


    @GetMapping("/{id}")
    public ResponseEntity<ModoHistoriaDetalleDTO> obtenerModoHistoria(@PathVariable Long id) {
        return ResponseEntity.ok(modoHistoriaService.obtenerModoHistoriaPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ModoHistoriaDetalleDTO> actualizarModoHistoria(@PathVariable Long id, @Valid @RequestBody ModoHistoriaUpdateDTO dto) {
        return ResponseEntity.ok(modoHistoriaService.actualizarModoHistoria(id, dto));
    }

    @GetMapping
    public ResponseEntity<List<ModoHistoriaDetalleDTO>> obtenerModoHistoriasPublicas() {
        return ResponseEntity.ok(modoHistoriaService.listarModoHistoriasPublicas());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarModoHistoria(@PathVariable Long id) {
        modoHistoriaService.eliminarModoHistoria(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/salir")
    public ResponseEntity<String> salirDeModoHistoria(@PathVariable Long id) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autorizado");
        }
        String email = authentication.getName();
        joinService.salirDeModoHistoria(email, id);
        return ResponseEntity.ok("Has salido de la campaÃ±a correctamente");
    }

    @GetMapping("/{id}/jugadores")
    public ResponseEntity<List<PersonajeResponseDTO>> listarJugadoresDeModoHistoria(@PathVariable Long id) {
        return ResponseEntity.ok(modoHistoriaService.listarJugadoresDeModoHistoria(id));
    }

    @GetMapping("/{id}/misiones")
    public ResponseEntity<List<MisionResumenDTO>> listarMisionesDeModoHistoria(@PathVariable Long id) {
        return ResponseEntity.ok(modoHistoriaService.listarMisionesDeModoHistoria(id));
    }

    @GetMapping("/{id}/enemigos")
    public ResponseEntity<List<ModoHistoriaEnemigoResponseDTO>> listarEnemigosDeModoHistoria(@PathVariable Long id) {
        return ResponseEntity.ok(modoHistoriaService.listarEnemigosDeModoHistoria(id));
    }

}

