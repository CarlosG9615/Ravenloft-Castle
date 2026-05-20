package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Hechizo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HechizoRepository extends JpaRepository<Hechizo, Long> {
}

