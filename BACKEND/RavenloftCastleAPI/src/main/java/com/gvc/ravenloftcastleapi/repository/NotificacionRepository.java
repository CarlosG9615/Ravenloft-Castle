package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioDestinoIdOrderByFechaDesc(Long usuarioDestinoId);
    long countByUsuarioDestinoIdAndLeidaFalse(Long usuarioDestinoId);
}
