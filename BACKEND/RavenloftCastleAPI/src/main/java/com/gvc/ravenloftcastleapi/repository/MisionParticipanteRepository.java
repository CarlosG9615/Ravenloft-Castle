package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MisionParticipanteRepository extends JpaRepository<MisionParticipante, Long> {

    List<MisionParticipante> findByMisionId(Long misionId);

    List<MisionParticipante> findByUsuarioId(Long usuarioId);
}

