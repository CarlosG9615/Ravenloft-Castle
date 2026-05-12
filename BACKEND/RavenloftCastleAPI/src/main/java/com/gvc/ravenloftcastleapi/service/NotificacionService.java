package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.NotificacionDTO;
import com.gvc.ravenloftcastleapi.entity.Notificacion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.exception.UserNotFoundException;
import com.gvc.ravenloftcastleapi.repository.NotificacionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void crearNotificacion(Long usuarioDestinoId, Long usuarioOrigenId, String tipo, String mensaje, Long campanaId, String campanaNombre) {
        Usuario destino = usuarioRepository.findById(usuarioDestinoId)
                .orElseThrow(() -> new UserNotFoundException("Usuario destino no encontrado"));
        Usuario origen = usuarioRepository.findById(usuarioOrigenId)
                .orElseThrow(() -> new UserNotFoundException("Usuario origen no encontrado"));

        Notificacion notificacion = Notificacion.builder()
                .usuarioDestino(destino)
                .usuarioOrigen(origen)
                .tipo(tipo)
                .mensaje(mensaje)
                .campanaId(campanaId)
                .campanaNombre(campanaNombre)
                .leida(false)
                .build();

        Notificacion saved = notificacionRepository.save(notificacion);
        NotificacionDTO dto = mapToDTO(saved);

        messagingTemplate.convertAndSend(
                "/topic/usuario/" + usuarioDestinoId + "/notificaciones", dto
        );
    }

    public List<NotificacionDTO> getMisNotificaciones() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        return notificacionRepository.findByUsuarioDestinoIdOrderByFechaDesc(usuario.getId())
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public long contarNoLeidas() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        return notificacionRepository.countByUsuarioDestinoIdAndLeidaFalse(usuario.getId());
    }

    @Transactional
    public void marcarComoLeida(Long id) {
        Notificacion n = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));
        n.setLeida(true);
        notificacionRepository.save(n);
    }

    @Transactional
    public void marcarTodasComoLeidas() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        List<Notificacion> noLeidas = notificacionRepository
                .findByUsuarioDestinoIdOrderByFechaDesc(usuario.getId())
                .stream().filter(n -> !n.isLeida()).collect(Collectors.toList());
        noLeidas.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(noLeidas);
    }

    private NotificacionDTO mapToDTO(Notificacion n) {
        return new NotificacionDTO(
                n.getId(),
                n.getTipo(),
                n.getMensaje(),
                n.isLeida(),
                n.getFecha(),
                n.getCampanaId(),
                n.getCampanaNombre(),
                n.getUsuarioOrigen() != null ? n.getUsuarioOrigen().getNombre() : null,
                n.getUsuarioOrigen() != null ? n.getUsuarioOrigen().getAvatar() : null
        );
    }
}