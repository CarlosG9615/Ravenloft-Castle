package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.TiradaDado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TiradaDadoRepository extends JpaRepository<TiradaDado, Long> {

    List<TiradaDado> findByMisionIdAndPersonajeUsuarioIdInOrderByFechaDesc(Long misionId, Collection<Long> usuarioIds);

    List<TiradaDado> findByMisionIdAndPersonajeIdOrderByFechaDesc(Long misionId, Long personajeId);

    Optional<TiradaDado> findByIdAndMisionId(Long id, Long misionId);

    List<TiradaDado> findByMisionProgresoIdOrderByFechaDesc(Long misionProgresoId);
}

