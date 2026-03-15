package com.gvc.ravenloftcastleapi.controller.join;

import com.gvc.ravenloftcastleapi.dto.join.JoinRequestDTO;
import com.gvc.ravenloftcastleapi.dto.join.JoinResponseDTO;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import com.gvc.ravenloftcastleapi.service.JoinService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/join")
@RequiredArgsConstructor
public class JoinController {

    private final JoinService joinService;
    private final UsuarioRepository usuarioRepository;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<Page<Campana>> findByTipo(@RequestParam String tipo,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {

        TipoSuscripcion tipooEnum;
        try {
            tipooEnum = TipoSuscripcion.fromString(tipo);
        } catch (IllegalArgumentException e) {
            // Manejar error si el tipo no es válido.
            // O dejar que propague si tenemos un GlobalExceptionHandler para IllegalArgumentException (que lo tenemos)
            throw new IllegalArgumentException("Tipo de suscripcion invalido: " + tipo);
        }

        Page<Campana> result = joinService.findByTipo(tipooEnum, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<JoinResponseDTO> joinByCode(@RequestBody JoinRequestDTO dto) {
        String email = getCurrentUserEmail();
        JoinResponseDTO resp = joinService.joinByCode(email, dto);
        return ResponseEntity.ok(resp);
    }
}
