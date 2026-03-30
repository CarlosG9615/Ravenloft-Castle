package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioDTO;
import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioCreateDTO;
import com.gvc.ravenloftcastleapi.dto.escenario.EscenarioUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Escenario;
import com.gvc.ravenloftcastleapi.repository.EscenarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EscenarioService {

    private final EscenarioRepository escenarioRepository;

    public List<EscenarioDTO> getAllEscenarios() {
        return escenarioRepository.findAll().stream()
                .map(e -> new EscenarioDTO(
                        e.getId(),
                        e.getNombre(),
                        e.getDescripcion(),
                        e.getObjeto(),
                        e.getIluminacion(),
                        e.getTerreno()
                ))
                .collect(Collectors.toList());
    }

    public EscenarioDTO getEscenarioById(Long id) {
        return escenarioRepository.findById(id)
                .map(e -> new EscenarioDTO(
                        e.getId(),
                        e.getNombre(),
                        e.getDescripcion(),
                        e.getObjeto(),
                        e.getIluminacion(),
                        e.getTerreno()
                ))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Escenario no encontrado con ID: " + id));
    }

    public EscenarioDTO crearEscenario(EscenarioCreateDTO dto) {
        Escenario escenario = Escenario.builder()
                .nombre(dto.nombre())
                .descripcion(dto.descripcion())
                .objeto(dto.objeto())
                .iluminacion(dto.iluminacion())
                .terreno(dto.terreno())
                .build();

        escenario = escenarioRepository.save(escenario);

        return new EscenarioDTO(
                escenario.getId(),
                escenario.getNombre(),
                escenario.getDescripcion(),
                escenario.getObjeto(),
                escenario.getIluminacion(),
                escenario.getTerreno()
        );
    }

    public EscenarioDTO actualizarEscenario(Long id, EscenarioUpdateDTO dto) {
        Escenario escenario = escenarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Escenario no encontrado con ID: " + id));

        if (dto.nombre() != null) {
            escenario.setNombre(dto.nombre());
        }
        if (dto.descripcion() != null) {
            escenario.setDescripcion(dto.descripcion());
        }
        if (dto.objeto() != null) {
            escenario.setObjeto(dto.objeto());
        }
        if (dto.iluminacion() != null) {
            escenario.setIluminacion(dto.iluminacion());
        }
        if (dto.terreno() != null) {
            escenario.setTerreno(dto.terreno());
        }

        escenario = escenarioRepository.save(escenario);

        return new EscenarioDTO(
                escenario.getId(),
                escenario.getNombre(),
                escenario.getDescripcion(),
                escenario.getObjeto(),
                escenario.getIluminacion(),
                escenario.getTerreno()
        );
    }

    public void eliminarEscenario(Long id) {
        if (!escenarioRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Escenario no encontrado con ID: " + id);
        }
        escenarioRepository.deleteById(id);
    }
}
