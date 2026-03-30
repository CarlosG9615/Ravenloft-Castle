package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.Armadura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArmaduraRepository extends JpaRepository<Armadura, Long> {
}

