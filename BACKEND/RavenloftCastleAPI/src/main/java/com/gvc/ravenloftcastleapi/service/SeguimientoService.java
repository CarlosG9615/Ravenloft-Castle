package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.PerfilPublicoDTO;
import com.gvc.ravenloftcastleapi.dto.SeguimientoDTO;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Seguimiento;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.exception.UserNotFoundException;
import com.gvc.ravenloftcastleapi.repository.CampanaRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.SeguimientoRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeguimientoService {

    private final SeguimientoRepository seguimientoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final CampanaRepository campanaRepository;
    private final PersonajeRepository personajeRepository;

    private Usuario getUsuarioActual() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public void seguir(Long seguidoId) {
        Usuario seguidor = getUsuarioActual();
        Usuario seguido = usuarioRepository.findById(seguidoId)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));

        if (seguidor.getId().equals(seguidoId)) return;
        if (seguimientoRepository.existsBySeguidorIdAndSeguidoId(seguidor.getId(), seguidoId)) return;

        Seguimiento seguimiento = Seguimiento.builder()
                .seguidor(seguidor)
                .seguido(seguido)
                .build();
        seguimientoRepository.save(seguimiento);

        notificacionService.crearNotificacion(
                seguidoId,
                seguidor.getId(),
                "SEGUIMIENTO",
                seguidor.getNombre() + " ha empezado a seguirte",
                null,
                null
        );
    }

    @Transactional
    public void dejarDeSeguir(Long seguidoId) {
        Usuario seguidor = getUsuarioActual();
        seguimientoRepository.deleteBySeguidorIdAndSeguidoId(seguidor.getId(), seguidoId);
    }

    public List<SeguimientoDTO> getSeguidores(Long usuarioId) {
        return seguimientoRepository.findBySeguidoId(usuarioId)
                .stream().map(s -> new SeguimientoDTO(
                        s.getId(),
                        s.getSeguidor().getId(),
                        s.getSeguidor().getNombre(),
                        s.getSeguidor().getAvatar(),
                        s.getFecha()
                )).collect(Collectors.toList());
    }

    public List<SeguimientoDTO> getSiguiendo(Long usuarioId) {
        return seguimientoRepository.findBySeguidorId(usuarioId)
                .stream().map(s -> new SeguimientoDTO(
                        s.getId(),
                        s.getSeguido().getId(),
                        s.getSeguido().getNombre(),
                        s.getSeguido().getAvatar(),
                        s.getFecha()
                )).collect(Collectors.toList());
    }

    public PerfilPublicoDTO getPerfilPublico(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        Usuario actual = getUsuarioActual();

        int numSeguidores = seguimientoRepository.findBySeguidoId(usuarioId).size();
        int numSiguiendo = seguimientoRepository.findBySeguidorId(usuarioId).size();
        boolean yoLeSigo = seguimientoRepository.existsBySeguidorIdAndSeguidoId(actual.getId(), usuarioId);

        return new PerfilPublicoDTO(
                usuario.getId(), usuario.getNombre(), usuario.getAvatar(),
                usuario.getRole().getNombre(), numSeguidores, numSiguiendo, yoLeSigo
        );
    }
    public PerfilPublicoDTO getPerfilPorPersonaje(Long personajeId) {
        Personaje personaje = personajeRepository.findById(personajeId)
                .orElseThrow(() -> new UserNotFoundException("Personaje no encontrado"));
        return getPerfilPublico(personaje.getUsuario().getId());
    }

    private String calcularNombreNivel(int nivel) {
        if (nivel <= 2) return "Aldeano";
        if (nivel <= 4) return "Aventurero";
        if (nivel <= 6) return "Veterano";
        if (nivel <= 9) return "Héroe";
        if (nivel <= 12) return "Campeón";
        return "Leyenda";
    }
}