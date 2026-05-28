package com.gvc.ravenloftcastleapi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.gvc.ravenloftcastleapi.entity.ModoHistoriaPersonaje;

@Repository
public interface ModoHistoriaPersonajeRepository extends JpaRepository<ModoHistoriaPersonaje, Long> {

	boolean existsByModoHistoriaIdAndPersonajeId(Long modoHistoriaId, Long personajeId);

    List<ModoHistoriaPersonaje> findByModoHistoriaIdAndPersonajeUsuarioId(Long modoHistoriaId, Long usuarioId);

    @Transactional
    void deleteByModoHistoriaIdAndPersonajeId(Long modoHistoriaId, Long personajeId);

    @Transactional
    void deleteByPersonajeId(Long personajeId);
}

