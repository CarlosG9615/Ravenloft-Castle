package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CampanaRepository extends JpaRepository<Campana, Long> {

    Optional<Campana> findByCodigoInvitacion(String codigoInvitacion);

    Page<Campana> findByNivelAcceso(TipoSuscripcion nivelAcceso, Pageable pageable);
}
