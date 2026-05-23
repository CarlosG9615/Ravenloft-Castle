package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoDetalleDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.EnemigoCreateDTO;
import com.gvc.ravenloftcastleapi.dto.enemigo.StatsUpdateDTO;
import com.gvc.ravenloftcastleapi.entity.Enemigo;
import com.gvc.ravenloftcastleapi.repository.EnemigoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnemigosService {

    private final EnemigoRepository enemigoRepository;

    public List<EnemigoDetalleDTO> getEnemigos(){
        return enemigoRepository.findAll().stream()
                .map(e -> new EnemigoDetalleDTO(
                        e.getId(),
                        e.getNombre(),
                        e.getTipo(),
                        e.getCr().doubleValue(),
                        e.getSalud(),
                        e.getCa(),
                        e.getVelocidad(),
                        e.getIniciativa(),
                        new com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO(
                                e.getStr(),
                                e.getDex(),
                                e.getCon(),
                                e.getIng(),
                                e.getWis(),
                                e.getCha()
                        ),
                        e.getFuerzaAtaque(),
                        e.getDanoAtaque(),
                        e.getDescripcion()
                ))
                .toList();
    }

    public EnemigoDetalleDTO getEnemigoById(Long id) {
        Enemigo e = enemigoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enemigo no encontrado con id: " + id));
        return new EnemigoDetalleDTO(
                e.getId(),
                e.getNombre(),
                e.getTipo(),
                e.getCr().doubleValue(),
                e.getSalud(),
                e.getCa(),
                e.getVelocidad(),
                e.getIniciativa(),
                new com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO(
                        e.getStr(),
                        e.getDex(),
                        e.getCon(),
                        e.getIng(),
                        e.getWis(),
                        e.getCha()
                ),
                e.getFuerzaAtaque(),
                e.getDanoAtaque(),
                e.getDescripcion()
        );
    }

    public EnemigoDetalleDTO crearEnemigo(EnemigoCreateDTO dto) {
        Enemigo e = new Enemigo();
        e.setNombre(dto.nombre());
        e.setTipo(dto.tipo());
        e.setCr(dto.cr());
        e.setSalud(dto.salud());
        e.setCa(dto.ca());
        e.setVelocidad(dto.velocidad() != null ? dto.velocidad() : 30);
        e.setIniciativa(dto.iniciativa() != null ? dto.iniciativa() : 0);

        e.setStr(dto.stats().fuerza());
        e.setDex(dto.stats().destreza());
        e.setCon(dto.stats().constitucion());
        e.setIng(dto.stats().inteligencia());
        e.setWis(dto.stats().sabiduria());
        e.setCha(dto.stats().carisma());

        e.setFuerzaAtaque(dto.fuerzaAtaque());
        e.setDanoAtaque(dto.danoAtaque());
        e.setDescripcion(dto.descripcion());

        Enemigo saved = enemigoRepository.save(e);

        return new EnemigoDetalleDTO(
                saved.getId(),
                saved.getNombre(),
                saved.getTipo(),
                saved.getCr().doubleValue(),
                saved.getSalud(),
                saved.getCa(),
                saved.getVelocidad(),
                saved.getIniciativa(),
                new com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO(
                        saved.getStr(),
                        saved.getDex(),
                        saved.getCon(),
                        saved.getIng(),
                        saved.getWis(),
                        saved.getCha()
                ),
                saved.getFuerzaAtaque(),
                saved.getDanoAtaque(),
                saved.getDescripcion()
        );
    }

    public EnemigoDetalleDTO editarStats(Long id, StatsUpdateDTO statsDto) {
        Enemigo e = enemigoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enemigo no encontrado con id: " + id));

        if (statsDto.fuerza() != null) e.setStr(statsDto.fuerza());
        if (statsDto.destreza() != null) e.setDex(statsDto.destreza());
        if (statsDto.constitucion() != null) e.setCon(statsDto.constitucion());
        if (statsDto.inteligencia() != null) e.setIng(statsDto.inteligencia());
        if (statsDto.sabiduria() != null) e.setWis(statsDto.sabiduria());
        if (statsDto.carisma() != null) e.setCha(statsDto.carisma());

        Enemigo saved = enemigoRepository.save(e);

        return new EnemigoDetalleDTO(
                saved.getId(),
                saved.getNombre(),
                saved.getTipo(),
                saved.getCr().doubleValue(),
                saved.getSalud(),
                saved.getCa(),
                saved.getVelocidad(),
                saved.getIniciativa(),
                new com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO(
                        saved.getStr(),
                        saved.getDex(),
                        saved.getCon(),
                        saved.getIng(),
                        saved.getWis(),
                        saved.getCha()
                ),
                saved.getFuerzaAtaque(),
                saved.getDanoAtaque(),
                saved.getDescripcion()
        );
    }

    public void eliminarEnemigo(Long id) {
        if (!enemigoRepository.existsById(id)) {
            throw new RuntimeException("Enemigo no encontrado con id: " + id);
        }
        enemigoRepository.deleteById(id);
    }
}