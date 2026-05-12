package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.CampanaJugador;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CampanaJugadorRepository extends JpaRepository<CampanaJugador, Long> {
    List<CampanaJugador> findByCampanaId(Long campanaId);
    List<CampanaJugador> findByUsuarioId(Long usuarioId);
    boolean existsByCampanaIdAndUsuarioId(Long campanaId, Long usuarioId);
}
