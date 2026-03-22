package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.CampanaPersonaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampanaPersonajeRepository extends JpaRepository<CampanaPersonaje, Long> {

	boolean existsByCampanaIdAndPersonajeId(Long campanaId, Long personajeId);

    List<CampanaPersonaje> findByCampanaIdAndPersonajeUsuarioId(Long campanaId, Long usuarioId);
}
