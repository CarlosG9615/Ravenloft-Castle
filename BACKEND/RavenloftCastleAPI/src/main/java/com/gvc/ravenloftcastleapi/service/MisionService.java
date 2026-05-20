package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioResumenDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionEscenarioCreateDTO;
import com.gvc.ravenloftcastleapi.dto.mision.MisionUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.ModoHistoria;
import com.gvc.ravenloftcastleapi.entity.Escenario;
import com.gvc.ravenloftcastleapi.entity.Mision;
import com.gvc.ravenloftcastleapi.entity.MisionEscenario;
import com.gvc.ravenloftcastleapi.repository.ModoHistoriaRepository;
import com.gvc.ravenloftcastleapi.repository.EscenarioRepository;
import com.gvc.ravenloftcastleapi.repository.MisionEscenarioRepository;
import com.gvc.ravenloftcastleapi.repository.MisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MisionService {

    private final MisionRepository misionRepository;
    private final ModoHistoriaRepository modoHistoriaRepository;
    private final EscenarioRepository escenarioRepository;
    private final MisionEscenarioRepository misionEscenarioRepository;

    @Transactional
    public MisionDetalleDTO crearMision(MisionCreateDTO dto) {
        ModoHistoria modoHistoria = modoHistoriaRepository.findById(dto.modoHistoriaId())
                .orElseThrow(() -> new RuntimeException("CampaÃ±a no encontrada con id: " + dto.modoHistoriaId()));

        Mision mision = Mision.builder()
                .modoHistoria(modoHistoria)
                .nombre(dto.nombre())
                .descripcion(dto.descripcion())
                .orden(dto.orden())
                .dificultad(dto.dificultad())
                .xpRecompensa(dto.xpRecompensa())
                .completada(false)
                .build();

        Mision misionGuardada = misionRepository.save(mision);

        if (dto.escenarios() != null && !dto.escenarios().isEmpty()) {
            for (MisionEscenarioCreateDTO escenarioDTO : dto.escenarios()) {
                Escenario escenario = escenarioRepository.findById(escenarioDTO.id())
                        .orElseThrow(() -> new RuntimeException("Escenario no encontrado con id: " + escenarioDTO.id()));

                MisionEscenario misionEscenario = MisionEscenario.builder()
                        .mision(misionGuardada)
                        .escenario(escenario)
                        .orden(escenarioDTO.orden())
                        .multiplicadorEnemigos(escenarioDTO.multiplicadorEnemigos() != null ? escenarioDTO.multiplicadorEnemigos() : BigDecimal.ONE)
                        .dificultad(escenarioDTO.dificultad() != null ? escenarioDTO.dificultad() : 1)
                        .build();

                misionEscenarioRepository.save(misionEscenario);
            }
            // Recargar mision para tener los escenarios en la respuesta
            misionGuardada = misionRepository.findById(misionGuardada.getId()).orElse(misionGuardada);
        }

        return mapToMisionDetalleDTO(misionGuardada);
    }

    @Transactional
    public MisionDetalleDTO actualizarMision(Long id, MisionUpdateDTO dto) {
        Mision mision = misionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MisiÃ³n no encontrada con id: " + id));

        if (dto.nombre() != null) mision.setNombre(dto.nombre());
        if (dto.descripcion() != null) mision.setDescripcion(dto.descripcion());
        if (dto.orden() != null) mision.setOrden(dto.orden());
        if (dto.dificultad() != null) mision.setDificultad(dto.dificultad());
        if (dto.xpRecompensa() != null) mision.setXpRecompensa(dto.xpRecompensa());
        if (dto.completada() != null) mision.setCompletada(dto.completada());

        if (dto.escenarios() != null) {
            // Limpiar escenarios existentes
            mision.getEscenarios().clear();
            
            // AÃ±adir nuevos escenarios
            for (MisionEscenarioCreateDTO escenarioDTO : dto.escenarios()) {
                Escenario escenario = escenarioRepository.findById(escenarioDTO.id())
                        .orElseThrow(() -> new RuntimeException("Escenario no encontrado con id: " + escenarioDTO.id()));

                MisionEscenario nuevoEscenario = MisionEscenario.builder()
                        .mision(mision)
                        .escenario(escenario)
                        .orden(escenarioDTO.orden())
                        .multiplicadorEnemigos(escenarioDTO.multiplicadorEnemigos() != null ? escenarioDTO.multiplicadorEnemigos() : BigDecimal.ONE)
                        .dificultad(escenarioDTO.dificultad() != null ? escenarioDTO.dificultad() : 1)
                        .build();

                mision.getEscenarios().add(nuevoEscenario);
            }
        }

        Mision misionActualizada = misionRepository.save(mision);
        return mapToMisionDetalleDTO(misionActualizada);
    }
    
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

    @Transactional
    public void eliminarMision(Long id) {
        if (!misionRepository.existsById(id)) {
            throw new RuntimeException("Misin no encontrada con id: " + id);
        }
        misionRepository.deleteById(id);
    }

    @Transactional
    public MisionDetalleDTO vincularEscenario(Long misionId, MisionEscenarioCreateDTO dto) {
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new RuntimeException("Misin no encontrada con id: " + misionId));

        Escenario escenario = escenarioRepository.findById(dto.id())
                .orElseThrow(() -> new RuntimeException("Escenario no encontrado con id: " + dto.id()));

        MisionEscenario misionEscenario = MisionEscenario.builder()
                .mision(mision)
                .escenario(escenario)
                .orden(dto.orden())
                .multiplicadorEnemigos(dto.multiplicadorEnemigos() != null ? dto.multiplicadorEnemigos() : BigDecimal.ONE)
                .dificultad(dto.dificultad() != null ? dto.dificultad() : 1)
                .build();

        misionEscenarioRepository.save(misionEscenario);

        mision.getEscenarios().add(misionEscenario);
        return mapToMisionDetalleDTO(mision);
    }

    @Transactional
    public MisionDetalleDTO desvincularEscenario(Long misionId, Long escenarioId) {
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new RuntimeException("MisiÃ³n no encontrada con id: " + misionId));

        MisionEscenario vinculo = mision.getEscenarios().stream()
                .filter(me -> me.getEscenario().getId().equals(escenarioId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("El escenario no estÃ¡ vinculado a la misiÃ³n."));

        mision.getEscenarios().remove(vinculo);
        misionEscenarioRepository.delete(vinculo);

        return mapToMisionDetalleDTO(mision);
    }

    @Transactional
    public MisionDetalleDTO actualizarDificultadEscenario(Long misionId, Long escenarioId, int dificultad) {
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new RuntimeException("MisiÃ³n no encontrada con id: " + misionId));

        MisionEscenario vinculo = mision.getEscenarios().stream()
                .filter(me -> me.getEscenario().getId().equals(escenarioId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("El escenario no estÃ¡ vinculado a la misiÃ³n."));

        vinculo.setDificultad(dificultad);
        misionEscenarioRepository.save(vinculo);

        return mapToMisionDetalleDTO(mision);
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

