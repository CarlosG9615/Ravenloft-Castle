package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Suscripcion;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {

    List<Suscripcion> findByUsuario_Email(String email);

    List<Suscripcion> findByUsuarioId(Long usuarioId);

    List<Suscripcion> findByUsuarioIdAndEstadoIgnoreCase(Long usuarioId, String estado);

    boolean existsByUsuarioIdAndTipoAndEstado(Long usuarioId, TipoSuscripcion tipo, String estado);
}
