package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.CampanaPersonaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampanaPersonajeRepository extends JpaRepository<CampanaPersonaje, Long> {
}

