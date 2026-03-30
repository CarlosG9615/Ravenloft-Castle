package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MisionParticipanteRepository extends JpaRepository<MisionParticipante, Long> {

    List<MisionParticipante> findByMisionId(Long misionId);

    List<MisionParticipante> findByUsuarioId(Long usuarioId);

    boolean existsByMisionIdAndUsuarioId(Long misionId, Long usuarioId);

    boolean existsByMisionIdAndUsuarioIdAndIdNot(Long misionId, Long usuarioId, Long id);

    Optional<MisionParticipante> findByIdAndMisionId(Long id, Long misionId);

    Optional<MisionParticipante> findByMisionIdAndUsuarioId(Long misionId, Long usuarioId);
}

