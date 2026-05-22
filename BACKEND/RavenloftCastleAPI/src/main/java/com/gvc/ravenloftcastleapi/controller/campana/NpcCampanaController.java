package com.gvc.ravenloftcastleapi.controller.campana;

import com.gvc.ravenloftcastleapi.dto.NpcCampanaDTO;
import com.gvc.ravenloftcastleapi.service.NpcCampanaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campanas/{campanaId}/npcs")
@RequiredArgsConstructor
public class NpcCampanaController {

    private final NpcCampanaService npcService;

    @GetMapping
    public ResponseEntity<List<NpcCampanaDTO>> obtenerNpcs(@PathVariable Long campanaId) {
        return ResponseEntity.ok(npcService.obtenerNpcs(campanaId));
    }

    @PostMapping
    public ResponseEntity<NpcCampanaDTO> crearNpc(
            @PathVariable Long campanaId,
            @RequestBody NpcCampanaDTO request) {
        return ResponseEntity.ok(npcService.crearNpc(
                campanaId,
                request.getNombre(),
                request.getDescripcion(),
                request.getRol(),
                request.getImagenUrl()
        ));
    }

    @DeleteMapping("/{npcId}")
    public ResponseEntity<Void> eliminarNpc(@PathVariable Long campanaId,
                                            @PathVariable Long npcId) {
        npcService.eliminarNpc(npcId);
        return ResponseEntity.noContent().build();
    }
}
