package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.ModoHistoriaPersonaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModoHistoriaPersonajeRepository extends JpaRepository<ModoHistoriaPersonaje, Long> {

	boolean existsByModoHistoriaIdAndPersonajeId(Long modoHistoriaId, Long personajeId);

    List<ModoHistoriaPersonaje> findByModoHistoriaIdAndPersonajeUsuarioId(Long modoHistoriaId, Long usuarioId);
}

