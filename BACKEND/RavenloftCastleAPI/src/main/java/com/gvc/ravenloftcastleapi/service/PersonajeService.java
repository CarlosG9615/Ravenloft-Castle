package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeCreateDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.entity.Clase;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Raza;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.ClaseRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.RazaRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonajeService {

    private final PersonajeRepository personajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClaseRepository claseRepository;
    private final RazaRepository razaRepository;

    @Transactional(readOnly = true)
    public List<PersonajeResponseDTO> listByUserEmail(String email) {
        Usuario user = getUsuarioByEmail(email);
        return personajeRepository.findByUsuarioId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PersonajeResponseDTO> listByUsuarioIdForCurrentUser(String email, Long usuarioId) {
        Usuario user = getUsuarioByEmail(email);
        validateOwnership(user, usuarioId);
        return personajeRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PersonajeResponseDTO getOneByUserEmail(String email, Long id) {
        Usuario user = getUsuarioByEmail(email);
        Personaje personaje = personajeRepository.findByIdAndUsuarioId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));
        return toResponse(personaje);
    }

    @Transactional
    public PersonajeResponseDTO createForUserEmail(String email, PersonajeCreateDTO dto) {
        Usuario user = getUsuarioByEmail(email);
        validateOwnership(user, dto.getUsuarioId());
        validateHitPoints(dto);

        Clase clase = getClaseByNombre(dto.getClase());
        Raza raza = getRazaByNombre(dto.getRaza());

        Personaje personaje = Personaje.builder()
                .usuario(user)
                .nombre(dto.getNombre())
                .clase(clase)
                .raza(raza)
                .nivel(dto.getNivel())
                .experiencia(0)
                .puntosGolpeMax(dto.getPuntosGolpeMax())
                .puntosGolpeActual(dto.getPuntosGolpeActual())
                .fuerza(dto.getFuerza())
                .destreza(dto.getDestreza())
                .constitucion(dto.getConstitucion())
                .inteligencia(dto.getInteligencia())
                .sabiduria(dto.getSabiduria())
                .carisma(dto.getCarisma())
                .claseArmadura(dto.getClaseArmadura())
                .iniciativa(dto.getIniciativa())
                .velocidad(dto.getVelocidad())
                .bonificacionCompetencia(dto.getBonificacionCompetencia())
                .alineamiento(dto.getAlineamiento())
                .build();

        return toResponse(personajeRepository.save(personaje));
    }

    @Transactional
    public PersonajeResponseDTO updateForUserEmail(String email, Long id, PersonajeCreateDTO dto) {
        Usuario user = getUsuarioByEmail(email);
        validateOwnership(user, dto.getUsuarioId());
        validateHitPoints(dto);

        Personaje personaje = personajeRepository.findByIdAndUsuarioId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));

        personaje.setNombre(dto.getNombre());
        personaje.setClase(getClaseByNombre(dto.getClase()));
        personaje.setRaza(getRazaByNombre(dto.getRaza()));
        personaje.setNivel(dto.getNivel());
        personaje.setPuntosGolpeMax(dto.getPuntosGolpeMax());
        personaje.setPuntosGolpeActual(dto.getPuntosGolpeActual());
        personaje.setFuerza(dto.getFuerza());
        personaje.setDestreza(dto.getDestreza());
        personaje.setConstitucion(dto.getConstitucion());
        personaje.setInteligencia(dto.getInteligencia());
        personaje.setSabiduria(dto.getSabiduria());
        personaje.setCarisma(dto.getCarisma());
        personaje.setClaseArmadura(dto.getClaseArmadura());
        personaje.setIniciativa(dto.getIniciativa());
        personaje.setVelocidad(dto.getVelocidad());
        personaje.setBonificacionCompetencia(dto.getBonificacionCompetencia());
        personaje.setAlineamiento(dto.getAlineamiento());

        return toResponse(personajeRepository.save(personaje));
    }

    private Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private void validateOwnership(Usuario user, Long usuarioId) {
        if (!user.getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes operar personajes de otro usuario");
        }
    }

    private void validateHitPoints(PersonajeCreateDTO dto) {
        if (dto.getPuntosGolpeActual() > dto.getPuntosGolpeMax()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los puntos de golpe actuales no pueden superar los máximos");
        }
    }

    private Clase getClaseByNombre(String nombreClase) {
        return claseRepository.findByNombreIgnoreCase(nombreClase.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clase no encontrada: " + nombreClase));
    }

    private Raza getRazaByNombre(String nombreRaza) {
        return razaRepository.findByNombreIgnoreCase(nombreRaza.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Raza no encontrada: " + nombreRaza));
    }

    private PersonajeResponseDTO toResponse(Personaje personaje) {
        return PersonajeResponseDTO.builder()
                .id(personaje.getId())
                .nombre(personaje.getNombre())
                .clase(personaje.getClase().getNombre())
                .raza(personaje.getRaza().getNombre())
                .nivel(personaje.getNivel())
                .fuerza(personaje.getFuerza())
                .destreza(personaje.getDestreza())
                .constitucion(personaje.getConstitucion())
                .inteligencia(personaje.getInteligencia())
                .sabiduria(personaje.getSabiduria())
                .carisma(personaje.getCarisma())
                .puntosGolpeMax(personaje.getPuntosGolpeMax())
                .puntosGolpeActual(personaje.getPuntosGolpeActual())
                .claseArmadura(personaje.getClaseArmadura())
                .iniciativa(personaje.getIniciativa())
                .velocidad(personaje.getVelocidad())
                .bonificacionCompetencia(personaje.getBonificacionCompetencia())
                .alineamiento(personaje.getAlineamiento())
                .usuarioId(personaje.getUsuario().getId())
                .build();
    }
}
