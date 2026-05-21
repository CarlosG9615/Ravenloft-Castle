package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.NpcCampanaDTO;
import com.gvc.ravenloftcastleapi.entity.Campana;
import com.gvc.ravenloftcastleapi.entity.NpcCampana;
import com.gvc.ravenloftcastleapi.repository.CampanaRepository;
import com.gvc.ravenloftcastleapi.repository.NpcCampanaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NpcCampanaService {

    private final NpcCampanaRepository npcRepository;
    private final CampanaRepository campanaRepository;

    public List<NpcCampanaDTO> obtenerNpcs(Long campanaId) {
        return npcRepository.findByCampanaId(campanaId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public NpcCampanaDTO crearNpc(Long campanaId, String nombre,
                                  String descripcion, String rol, String imagenUrl) {
        Campana campana = campanaRepository.findById(campanaId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        NpcCampana npc = NpcCampana.builder()
                .campana(campana)
                .nombre(nombre)
                .descripcion(descripcion)
                .rol(rol != null ? rol : "NEUTRAL")
                .imagenUrl(imagenUrl)
                .build();

        return toDTO(npcRepository.save(npc));
    }

    public void eliminarNpc(Long npcId) {
        npcRepository.deleteById(npcId);
    }

    private NpcCampanaDTO toDTO(NpcCampana npc) {
        return NpcCampanaDTO.builder()
                .id(npc.getId())
                .campanaId(npc.getCampana().getId())
                .nombre(npc.getNombre())
                .descripcion(npc.getDescripcion())
                .rol(npc.getRol())
                .imagenUrl(npc.getImagenUrl())
                .build();
    }
}