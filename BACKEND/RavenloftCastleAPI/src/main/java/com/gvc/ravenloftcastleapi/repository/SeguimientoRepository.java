package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Seguimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SeguimientoRepository extends JpaRepository<Seguimiento, Long> {
    List<Seguimiento> findBySeguidorId(Long seguidorId);
    List<Seguimiento> findBySeguidoId(Long seguidoId);
    Optional<Seguimiento> findBySeguidorIdAndSeguidoId(Long seguidorId, Long seguidoId);
    boolean existsBySeguidorIdAndSeguidoId(Long seguidorId, Long seguidoId);
    void deleteBySeguidorIdAndSeguidoId(Long seguidorId, Long seguidoId);
}