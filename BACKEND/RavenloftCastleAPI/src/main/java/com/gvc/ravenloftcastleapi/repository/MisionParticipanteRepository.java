package com.gvc.ravenloftcastleapi.repository;

import com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO;
import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface MisionParticipanteRepository extends JpaRepository<MisionParticipante, Long> {

    List<MisionParticipante> findByMisionId(Long misionId);

    List<MisionParticipante> findByUsuarioId(Long usuarioId);

    boolean existsByMisionIdAndUsuarioId(Long misionId, Long usuarioId);

    boolean existsByMisionIdAndUsuarioIdAndIdNot(Long misionId, Long usuarioId, Long id);

    boolean existsByMisionIdAndUsuarioIdAndRol(Long misionId, Long usuarioId, com.gvc.ravenloftcastleapi.enums.RolParticipante rol);

    Optional<MisionParticipante> findByIdAndMisionId(Long id, Long misionId);

    Optional<MisionParticipante> findByMisionIdAndUsuarioId(Long misionId, Long usuarioId);

    Optional<MisionParticipante> findByMisionIdAndPersonajeId(Long misionId, Long personajeId);

    List<MisionParticipante> findByMisionIdAndPersonajeIsNotNull(Long misionId);

    boolean existsByMisionModoHistoriaIdAndUsuarioId(Long modoHistoriaId, Long usuarioId);

    @Query("""
        SELECT DISTINCT mp.personaje FROM MisionParticipante mp
        WHERE mp.mision.modoHistoria.id = :modoHistoriaId
        AND mp.personaje IS NOT NULL
    """)
    List<Personaje> findPersonajesActivosByModoHistoriaId(@Param("modoHistoriaId") Long modoHistoriaId);

    @Query("""
        SELECT new com.gvc.ravenloftcastleapi.dto.mision.ParticipanteJugadorDTO(
            mp.usuario.id,
            mp.personaje.id,
            u.nombre,
            p.nombre,
            c.nombre,
            p.nivel,
            p.puntosGolpeActual,
            p.puntosGolpeMax,
            p.avatar,
            mp.tokenCol,
            mp.tokenRow,
            mp.ordenUnion,
            p.fuerza,
            p.destreza,
            p.constitucion,
            p.inteligencia,
            p.sabiduria,
            p.carisma
        )
        FROM MisionParticipante mp
        JOIN Usuario u ON u.id = mp.usuario.id
        JOIN Personaje p ON p.id = mp.personaje.id
        JOIN Clase c ON c.id = p.clase.id
        WHERE mp.mision.id = :misionId AND mp.personaje IS NOT NULL
        ORDER BY mp.ordenUnion ASC
    """)
    List<ParticipanteJugadorDTO> findParticipantesJugadores(@Param("misionId") Long misionId);

    @Modifying
    @Transactional
    @Query("""
        UPDATE MisionParticipante mp
        SET mp.ordenUnion = mp.ordenUnion - 1
        WHERE mp.mision.id = :misionId AND mp.ordenUnion > :ordenUnion
    """)
    void decrementarOrdenesSuperiores(@Param("misionId") Long misionId,
                                      @Param("ordenUnion") int ordenUnion);

    @Modifying
    @Transactional
    @Query("""
        UPDATE MisionParticipante mp
        SET mp.tokenCol = :col, mp.tokenRow = :row
        WHERE mp.mision.id = :misionId AND mp.usuario.id = :usuarioId
    """)
    void actualizarPosicionToken(@Param("misionId") Long misionId, 
                                 @Param("usuarioId") Long usuarioId, 
                                 @Param("col") int col, 
                                 @Param("row") int row);
}

