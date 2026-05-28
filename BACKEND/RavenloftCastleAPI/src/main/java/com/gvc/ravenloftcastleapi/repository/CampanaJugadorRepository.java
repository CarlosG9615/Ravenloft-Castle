package com.gvc.ravenloftcastleapi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gvc.ravenloftcastleapi.entity.CampanaJugador;

public interface CampanaJugadorRepository extends JpaRepository<CampanaJugador, Long> {
    List<CampanaJugador> findByCampanaId(Long campanaId);
    List<CampanaJugador> findByUsuarioId(Long usuarioId);
    boolean existsByCampanaIdAndUsuarioId(Long campanaId, Long usuarioId);

    void deleteByPersonajeId(Long personajeId);
}
