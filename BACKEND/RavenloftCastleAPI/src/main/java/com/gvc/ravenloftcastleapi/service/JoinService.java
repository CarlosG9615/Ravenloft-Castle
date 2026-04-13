package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.join.JoinRequestDTO;
import com.gvc.ravenloftcastleapi.dto.join.JoinResponseDTO;
import com.gvc.ravenloftcastleapi.entity.ModoHistoria;
import com.gvc.ravenloftcastleapi.entity.ModoHistoriaPersonaje;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Suscripcion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import com.gvc.ravenloftcastleapi.repository.ModoHistoriaPersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.ModoHistoriaRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.SuscripcionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JoinService {

    private final ModoHistoriaRepository modoHistoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final PersonajeRepository personajeRepository;
    private final ModoHistoriaPersonajeRepository modoHistoriaPersonajeRepository;

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ModoHistoria> findByTipo(TipoSuscripcion tipo, org.springframework.data.domain.Pageable pageable) {
        List<TipoSuscripcion> nivelesPermitidos = TipoSuscripcion.levelsAccessibleBy(tipo);
        return modoHistoriaRepository.findByNivelAccesoIn(nivelesPermitidos, pageable);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ModoHistoria> findVisiblesByUserEmail(String userEmail, org.springframework.data.domain.Pageable pageable) {
        Usuario user = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        TipoSuscripcion maxNivelActivo = suscripcionRepository.findByUsuarioIdAndEstadoIgnoreCase(user.getId(), "ACTIVA")
                .stream()
                .map(Suscripcion::getTipo)
                .filter(tipo -> tipo != null)
                .max(Comparator.comparingInt(Enum::ordinal))
                .orElse(null);

        if (maxNivelActivo == null) {
            return org.springframework.data.domain.Page.empty(pageable);
        }

        List<TipoSuscripcion> nivelesPermitidos = TipoSuscripcion.levelsAccessibleBy(maxNivelActivo);
        return modoHistoriaRepository.findByNivelAccesoIn(nivelesPermitidos, pageable);
    }

    @Transactional
    public JoinResponseDTO joinByCode(String userEmail, JoinRequestDTO dto) {
        Usuario user = usuarioRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        ModoHistoria modoHistoria = modoHistoriaRepository.findByCodigoInvitacion(dto.getCodigoInvitacion())
                .orElseThrow(() -> new RuntimeException("CÃ³digo de invitaciÃ³n invÃ¡lido"));

        if (!modoHistoria.isActive()) {
            return new JoinResponseDTO("CampaÃ±a no activa");
        }

        TipoSuscripcion nivel = modoHistoria.getNivelAcceso();
        boolean tieneSubs = suscripcionRepository.findByUsuarioIdAndEstadoIgnoreCase(user.getId(), "ACTIVA")
                .stream()
                .map(Suscripcion::getTipo)
                .anyMatch(tipo -> tipo != null && tipo.canAccess(nivel));
        if (!tieneSubs) {
            Suscripcion s = Suscripcion.builder()
                    .usuario(user)
                    .nombre("Invitado por cÃ³digo: " + modoHistoria.getNombre())
                    .tipo(nivel)
                    .estado("ACTIVA")
                    .fechaAlta(LocalDate.now())
                    .build();
            suscripcionRepository.save(s);
        }

        Personaje p = personajeRepository.findById(dto.getPersonajeId()).orElseThrow(() -> new RuntimeException("Personaje no encontrado"));
        if (!p.getUsuario().getId().equals(user.getId())) {
            throw new RuntimeException("El personaje no pertenece al usuario");
        }

        // prevenir duplicados: comprobar si ya hay una uniÃ³n
        boolean already = modoHistoriaPersonajeRepository.findAll().stream()
                .anyMatch(cp -> cp.getModoHistoria().getId().equals(modoHistoria.getId()) && cp.getPersonaje().getId().equals(p.getId()));
        if (already) return new JoinResponseDTO("El personaje ya estÃ¡ unido a la campaÃ±a");

        ModoHistoriaPersonaje cp = ModoHistoriaPersonaje.builder()
                .modoHistoria(modoHistoria)
                .personaje(p)
                .fechaUnion(LocalDate.now())
                .build();
        modoHistoriaPersonajeRepository.save(cp);

        return new JoinResponseDTO("Unido correctamente a la campaÃ±a");
    }

    @Transactional
    public void salirDeModoHistoria(String userEmail, Long modoHistoriaId) {
        Usuario user = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!modoHistoriaRepository.existsById(modoHistoriaId)) {
            throw new RuntimeException("CampaÃ±a no encontrada");
        }

        var relaciones = modoHistoriaPersonajeRepository.findByModoHistoriaIdAndPersonajeUsuarioId(modoHistoriaId, user.getId());

        if (relaciones.isEmpty()) {
            throw new RuntimeException("El usuario no estÃ¡ unido a esta campaÃ±a");
        }

        modoHistoriaPersonajeRepository.deleteAll(relaciones);
    }
}

