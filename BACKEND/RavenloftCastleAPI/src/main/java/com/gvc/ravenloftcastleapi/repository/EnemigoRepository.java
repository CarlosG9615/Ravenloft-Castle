package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Enemigo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnemigoRepository extends JpaRepository<Enemigo, Long> {
}
