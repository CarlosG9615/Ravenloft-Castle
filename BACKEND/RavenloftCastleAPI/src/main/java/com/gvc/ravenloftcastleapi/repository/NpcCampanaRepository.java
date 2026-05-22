package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.NpcCampana;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NpcCampanaRepository extends JpaRepository<NpcCampana, Long> {
    List<NpcCampana> findByCampanaId(Long campanaId);
    void deleteByCampanaId(Long campanaId);
}
