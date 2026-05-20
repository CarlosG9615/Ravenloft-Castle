package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.MisionEscenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MisionEscenarioRepository extends JpaRepository<MisionEscenario, Long> {

    Optional<MisionEscenario> findByIdAndMisionId(Long id, Long misionId);
}

