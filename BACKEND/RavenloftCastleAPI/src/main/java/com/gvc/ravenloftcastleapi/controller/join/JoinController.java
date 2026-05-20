package com.gvc.ravenloftcastleapi.controller.join;

import com.gvc.ravenloftcastleapi.dto.join.JoinRequestDTO;
import com.gvc.ravenloftcastleapi.dto.join.JoinResponseDTO;
import com.gvc.ravenloftcastleapi.entity.ModoHistoria;
import com.gvc.ravenloftcastleapi.service.JoinService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/join")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class JoinController {

    private final JoinService joinService;

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new IllegalStateException("No hay usuario autenticado");
        }
        return authentication.getName();
    }

    @GetMapping
    public ResponseEntity<Page<ModoHistoria>> findByTipo(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size) {
        String email = getCurrentUserEmail();
        Page<ModoHistoria> result = joinService.findVisiblesByUserEmail(email, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<JoinResponseDTO> joinByCode(@RequestBody JoinRequestDTO dto) {
        String email = getCurrentUserEmail();
        JoinResponseDTO resp = joinService.joinByCode(email, dto);
        return ResponseEntity.ok(resp);
    }
}

