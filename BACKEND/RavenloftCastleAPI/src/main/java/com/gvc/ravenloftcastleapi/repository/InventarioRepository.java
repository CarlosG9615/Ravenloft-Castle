package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    List<Inventario> findByPersonajeId(Long personajeId);

    Optional<Inventario> findByIdAndPersonajeId(Long id, Long personajeId);

    Optional<Inventario> findByPersonajeIdAndArmaId(Long personajeId, Long armaId);

    Optional<Inventario> findByPersonajeIdAndArmaduraId(Long personajeId, Long armaduraId);

    Optional<Inventario> findByPersonajeIdAndHechizoId(Long personajeId, Long hechizoId);

    Optional<Inventario> findByPersonajeIdAndPocionId(Long personajeId, Long pocionId);
}

