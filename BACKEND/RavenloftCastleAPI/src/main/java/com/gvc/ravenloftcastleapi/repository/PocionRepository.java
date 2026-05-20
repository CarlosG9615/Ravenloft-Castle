package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Pocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PocionRepository extends JpaRepository<Pocion, Long> {
}

