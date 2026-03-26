package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeCreateDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PersonajeService {

    private final PersonajeRepository personajeRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<PersonajeResponseDTO> listByUserEmail(String email) {
        Usuario user = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return personajeRepository.findByUsuarioId(user.getId())
                .stream()
                .map(p -> new PersonajeResponseDTO(
                        p.getId(), p.getNombre(), p.getNivel(),
                        p.getRaza() != null ? p.getRaza().getId() : null,
                        p.getClase() != null ? p.getClase().getId() : null
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PersonajeResponseDTO getOneByUserEmail(String email, Long id) {
        Usuario user = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Personaje p = personajeRepository.findById(id).orElseThrow(() -> new RuntimeException("Personaje no encontrado"));
        if (!p.getUsuario().getId().equals(user.getId())) throw new RuntimeException("Acceso denegado");
        return new PersonajeResponseDTO(
                p.getId(), p.getNombre(), p.getNivel(),
                p.getRaza() != null ? p.getRaza().getId() : null,
                p.getClase() != null ? p.getClase().getId() : null
        );
    }

    @Transactional
    public PersonajeResponseDTO createForUserEmail(String email, PersonajeCreateDTO dto) {
        Usuario user = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Personaje p = Personaje.builder()
                .usuario(user)
                .nombre(dto.nombre)
                .nivel(1)
                .build();
        Personaje saved = personajeRepository.save(p);
        return new PersonajeResponseDTO(
                saved.getId(), saved.getNombre(), saved.getNivel(),
                saved.getRaza() != null ? saved.getRaza().getId() : null,
                saved.getClase() != null ? saved.getClase().getId() : null
        );
    }

    @Transactional
    public PersonajeResponseDTO updateForUserEmail(String email, Long id, PersonajeCreateDTO dto) {
        Usuario user = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Personaje p = personajeRepository.findById(id).orElseThrow(() -> new RuntimeException("Personaje no encontrado"));
        if (!p.getUsuario().getId().equals(user.getId())) throw new RuntimeException("Acceso denegado");
        p.setNombre(dto.nombre);
        p.setNivel(dto.str);
        Personaje saved = personajeRepository.save(p);
        return new PersonajeResponseDTO(
                saved.getId(), saved.getNombre(), saved.getNivel(),
                saved.getRaza() != null ? saved.getRaza().getId() : null,
                saved.getClase() != null ? saved.getClase().getId() : null
        );
    }
}

