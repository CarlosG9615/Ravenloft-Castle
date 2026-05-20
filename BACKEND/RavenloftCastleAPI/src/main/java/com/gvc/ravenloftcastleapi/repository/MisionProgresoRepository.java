package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.entity.MisionProgreso;
import com.gvc.ravenloftcastleapi.enums.TipoGuardadoProgreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MisionProgresoRepository extends JpaRepository<MisionProgreso, Long> {

    Optional<MisionProgreso> findByMisionIdAndUsuarioIdAndPersonajeIdAndNumeroGuardado(Long misionId, Long usuarioId, Long personajeId, Integer numeroGuardado);

    Optional<MisionProgreso> findByIdAndMisionId(Long id, Long misionId);

    List<MisionProgreso> findByMisionIdAndUsuarioIdAndPersonajeIdAndTipoGuardadoOrderByNumeroGuardadoDesc(
            Long misionId,
            Long usuarioId,
            Long personajeId,
            TipoGuardadoProgreso tipoGuardado
    );

    Optional<MisionProgreso> findFirstByMisionIdAndUsuarioIdAndPersonajeIdAndTipoGuardadoOrderByActualizadoEnDesc(
            Long misionId,
            Long usuarioId,
            Long personajeId,
            TipoGuardadoProgreso tipoGuardado
    );

    @Query("""
            select coalesce(max(mp.numeroGuardado), 0) + 1
            from MisionProgreso mp
            where mp.mision.id = :misionId
              and mp.usuario.id = :usuarioId
              and mp.personaje.id = :personajeId
              and mp.tipoGuardado = :tipoGuardado
            """)
    Integer nextNumeroGuardadoManual(
            @Param("misionId") Long misionId,
            @Param("usuarioId") Long usuarioId,
            @Param("personajeId") Long personajeId,
            @Param("tipoGuardado") TipoGuardadoProgreso tipoGuardado
    );
}

