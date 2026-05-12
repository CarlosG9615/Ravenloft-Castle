package com.gvc.ravenloftcastleapi.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.gvc.ravenloftcastleapi.entity.MensajeChatPersistido;

@Repository
public interface MensajeChatRepository extends JpaRepository<MensajeChatPersistido, Long> {

    List<MensajeChatPersistido> findByMisionIdOrderByCreadoEnAsc(Long misionId);

    List<MensajeChatPersistido> findByMisionIdAndCreadoEnAfterOrderByCreadoEnAsc(Long misionId, LocalDateTime since);

    @Modifying
    @Transactional
    void deleteByMisionId(Long misionId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM MensajeChatPersistido m WHERE m.misionId = :misionId AND m.personajeId = :personajeId")
    void deleteMensajesByMisionIdAndPersonajeId(@Param("misionId") Long misionId, @Param("personajeId") Long personajeId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM MensajeChatPersistido m WHERE m.misionId = :misionId AND m.usuarioId = :usuarioId")
    void deleteMensajesByMisionIdAndUsuarioId(@Param("misionId") Long misionId, @Param("usuarioId") Long usuarioId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM MensajeChatPersistido m WHERE m.misionId = :misionId AND m.personajeId IS NULL AND m.autor = :autor AND m.tipo != 'sistema'")
    void deleteLegacyMensajesByMisionIdAndAutor(@Param("misionId") Long misionId, @Param("autor") String autor);
}
