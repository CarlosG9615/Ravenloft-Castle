package com.gvc.ravenloftcastleapi.dto.inventario;

import java.util.List;

public record InventarioDTO(
        List<ArmaInventarioDTO> armas,
        List<ArmaduraInventarioDTO> armaduras,
        List<HechizoInventarioDTO> hechizos,
        List<PocionInventarioDTO> pociones
) {}

