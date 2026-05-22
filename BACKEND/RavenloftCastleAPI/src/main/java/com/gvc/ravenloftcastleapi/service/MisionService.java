package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioResumenDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionDetalleDTO;
import com.gvc.ravenloftcastleapi.entity.Escenario;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.MisionEscenario;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MisionService {

    private final MisionRepository misionRepository;

    @Transactional(readOnly = true)
    public MisionDetalleDTO obtenerMisionPorId(Long id) {
        Mision mision = misionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MisiÃ³n no encontrada con id: " + id));

        return mapToMisionDetalleDTO(mision);
    }

    @Transactional
    public void marcarComoCompletada(Long id, boolean completada) {
        Mision mision = misionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MisiÃ³n no encontrada con id: " + id));
        mision.setCompletada(completada);
        misionRepository.save(mision);
    }

    private MisionDetalleDTO mapToMisionDetalleDTO(Mision mision) {
        return new MisionDetalleDTO(
                mision.getId(),
                mision.getNombre(),
                mision.getDescripcion(),
                mision.getOrden(),
                mision.getDificultad(),
                mision.getXpRecompensa(),
                mision.isCompletada(),
                mapToEscenariosDTO(mision.getEscenarios())
        );
    }

    private List<EscenarioResumenDTO> mapToEscenariosDTO(List<MisionEscenario> escenarios) {
        return Optional.ofNullable(escenarios)
                .orElse(Collections.emptyList())
                .stream()
                .map(this::mapToEscenarioDTO)
                .collect(Collectors.toList());
    }

    private EscenarioResumenDTO mapToEscenarioDTO(MisionEscenario me) {
        if (me == null || me.getEscenario() == null) {
            return null;
        }
        Escenario escenario = me.getEscenario();
        return new EscenarioResumenDTO(
                escenario.getId(),
                escenario.getNombre(),
                escenario.getIluminacion(), // Es String, no Enum
                escenario.getTerreno(),     // Es String, no Enum
                me.getOrden(),
                me.getMultiplicadorEnemigos().doubleValue(), // Es BigDecimal, convertir a double
                me.getDificultad()
        );
    }

    @Transactional
    public void guardarConfigPartida(Long misionId, String configJson) {
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new RuntimeException("Misión no encontrada con id: " + misionId));
        mision.setConfigPartida(configJson);
        misionRepository.save(mision);
    }

    @Transactional(readOnly = true)
    public String obtenerConfigPartida(Long misionId) {
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new RuntimeException("Misión no encontrada con id: " + misionId));
        return mision.getConfigPartida();
    }

    @Transactional
    public void limpiarConfigPartida(Long misionId) {
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new RuntimeException("Misión no encontrada con id: " + misionId));
        mision.setConfigPartida(null);
        misionRepository.save(mision);
    }
}

