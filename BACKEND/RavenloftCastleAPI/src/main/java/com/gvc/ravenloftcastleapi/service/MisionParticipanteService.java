package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import com.gvc.ravenloftcastleapi.enums.RolParticipante;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import com.gvc.ravenloftcastleapi.repository.SuscripcionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MisionParticipanteService {

    private final MisionParticipanteRepository participanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final MisionRepository misionRepository;
    private final SuscripcionRepository suscripcionRepository;

    @Transactional
    public MisionParticipante unirUsuarioAMision(Long usuarioId, Long misionId, RolParticipante rol) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new RuntimeException("Mision no encontrada"));

        Campana campana = mision.getCampana();

        // Comprobar que el usuario tiene una suscripción activa que le da acceso a la campaña
        TipoSuscripcion nivel = campana.getNivelAcceso();
        boolean tieneSuscripcion = suscripcionRepository
                .existsByUsuarioIdAndTipoAndEstado(usuarioId, nivel, "ACTIVA");

        if (!tieneSuscripcion) {
            throw new RuntimeException("Usuario no tiene suscripción activa para esta campaña");
        }

        // evitar duplicados: comprobar si ya existe
        List<MisionParticipante> existentes = participanteRepository.findByMisionId(misionId);
        boolean ya = existentes.stream().anyMatch(p -> p.getUsuario().getId().equals(usuarioId));
        if (ya) {
            throw new RuntimeException("Usuario ya participa en la misión");
        }

        MisionParticipante participante = MisionParticipante.builder()
                .mision(mision)
                .usuario(usuario)
                .rol(rol)
                .fechaInicio(LocalDateTime.now())
                .build();

        return participanteRepository.save(participante);
    }

    @Transactional(readOnly = true)
    public boolean puedeAccederAMision(Long usuarioId, Long misionId) {
        List<MisionParticipante> lista = participanteRepository.findByMisionId(misionId);
        return lista.stream().anyMatch(p -> p.getUsuario().getId().equals(usuarioId)
                && (p.getRol() == RolParticipante.JUGADOR || p.getRol() == RolParticipante.MASTER));
    }

    @Transactional(readOnly = true)
    public List<MisionParticipante> findByUsuario(Long usuarioId) {
        return participanteRepository.findByUsuarioId(usuarioId);
    }

    @Transactional
    public void eliminarParticipacion(Long participanteId) {
        participanteRepository.deleteById(participanteId);
    }
}
