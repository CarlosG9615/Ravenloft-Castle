package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.ModoHistoria;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModoHistoriaRepository extends JpaRepository<ModoHistoria, Long> {

    Optional<ModoHistoria> findByCodigoInvitacion(String codigoInvitacion);

    boolean existsByCodigoInvitacion(String codigoInvitacion);

    Page<ModoHistoria> findByNivelAcceso(TipoSuscripcion nivelAcceso, Pageable pageable);

    Page<ModoHistoria> findByNivelAccesoIn(List<TipoSuscripcion> nivelesAcceso, Pageable pageable);
}

