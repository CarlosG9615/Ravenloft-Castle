package com.gvc.ravenloftcastleapi.controller.personaje;

import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeCreateDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.service.PersonajeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/characters")
@RequiredArgsConstructor
public class PersonajeController {

    private final PersonajeService personajeService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<PersonajeResponseDTO>> list() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(personajeService.listByUserEmail(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonajeResponseDTO> getOne(@PathVariable Long id) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(personajeService.getOneByUserEmail(email, id));
    }

    @PostMapping
    public ResponseEntity<PersonajeResponseDTO> create(@RequestBody PersonajeCreateDTO dto) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(personajeService.createForUserEmail(email, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonajeResponseDTO> update(@PathVariable Long id, @RequestBody PersonajeCreateDTO dto) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(personajeService.updateForUserEmail(email, id, dto));
    }
}
