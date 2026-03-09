package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.join.JoinRequestDTO;
import com.gvc.ravenloftcastleapi.dto.join.JoinResponseDTO;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.entity.CampanaPersonaje;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Suscripcion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.enums.TipoSuscripcion;
import com.gvc.ravenloftcastleapi.repository.CampanaPersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.CampanaRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.SuscripcionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class JoinService {

    private final CampanaRepository campanaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final PersonajeRepository personajeRepository;
    private final CampanaPersonajeRepository campanaPersonajeRepository;

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Campana> findByTipo(TipoSuscripcion tipo, org.springframework.data.domain.Pageable pageable) {
        return campanaRepository.findByNivelAcceso(tipo, pageable);
    }

    @Transactional
    public JoinResponseDTO joinByCode(String userEmail, JoinRequestDTO dto) {
        Usuario user = usuarioRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Campana campana = campanaRepository.findByCodigoInvitacion(dto.getCodigoInvitacion())
                .orElseThrow(() -> new RuntimeException("Código de invitación inválido"));

        if (!campana.isActive()) {
            return new JoinResponseDTO("Campaña no activa");
        }

        TipoSuscripcion nivel = campana.getNivelAcceso();
        boolean tieneSubs = suscripcionRepository.existsByUsuarioIdAndTipoAndEstado(user.getId(), nivel, "ACTIVA");
        if (!tieneSubs) {
            Suscripcion s = Suscripcion.builder()
                    .usuario(user)
                    .nombre("Invitado por código: " + campana.getNombre())
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

        // prevenir duplicados: comprobar si ya hay una unión
        boolean already = campanaPersonajeRepository.findAll().stream()
                .anyMatch(cp -> cp.getCampana().getId().equals(campana.getId()) && cp.getPersonaje().getId().equals(p.getId()));
        if (already) return new JoinResponseDTO("El personaje ya está unido a la campaña");

        CampanaPersonaje cp = CampanaPersonaje.builder()
                .campana(campana)
                .personaje(p)
                .fechaUnion(LocalDate.now())
                .build();
        campanaPersonajeRepository.save(cp);

        return new JoinResponseDTO("Unido correctamente a la campaña");
    }
}

