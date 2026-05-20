package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.inventario.AddItemInventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.ArmaduraInventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.ArmaInventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.HechizoInventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.InventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.PocionInventarioDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.UpdateInventarioItemDTO;
import com.gvc.ravenloftcastleapi.entity.Arma;
import com.gvc.ravenloftcastleapi.entity.Armadura;
import com.gvc.ravenloftcastleapi.entity.Hechizo;
import com.gvc.ravenloftcastleapi.entity.Inventario;
import com.gvc.ravenloftcastleapi.entity.MisionParticipante;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Pocion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.enums.RolParticipante;
import com.gvc.ravenloftcastleapi.repository.ArmaRepository;
import com.gvc.ravenloftcastleapi.repository.ArmaduraRepository;
import com.gvc.ravenloftcastleapi.repository.HechizoRepository;
import com.gvc.ravenloftcastleapi.repository.InventarioRepository;
import com.gvc.ravenloftcastleapi.repository.MisionParticipanteRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.PocionRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final InventarioRepository inventarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final MisionParticipanteRepository misionParticipanteRepository;
    private final PersonajeRepository personajeRepository;
    private final ArmaRepository armaRepository;
    private final ArmaduraRepository armaduraRepository;
    private final HechizoRepository hechizoRepository;
    private final PocionRepository pocionRepository;

    @Transactional(readOnly = true)
    public InventarioDTO listarInventarioPersonaje(String email, Long misionId, Long personajeId) {
        Usuario user = getUsuarioByEmail(email);
        MisionParticipante target = getParticipantePorPersonaje(misionId, personajeId);
        validarLecturaInventario(user, misionId, target);

        List<Inventario> items = inventarioRepository.findByPersonajeId(personajeId);
        return toInventarioDTO(items);
    }

    @Transactional(readOnly = true)
    public List<InventarioDTO> listarInventariosMision(String email, Long misionId) {
        Usuario user = getUsuarioByEmail(email);
        MisionParticipante actor = getParticipanteActorSiNoAdmin(user, misionId);

        List<MisionParticipante> jugadores = misionParticipanteRepository.findByMisionIdAndPersonajeIsNotNull(misionId)
                .stream()
                .filter(p -> p.getRol() == RolParticipante.JUGADOR)
                .toList();

        if (!isAdmin(user) && actor.getRol() == RolParticipante.JUGADOR) {
            jugadores = jugadores.stream()
                    .filter(p -> p.getUsuario().getId().equals(user.getId()))
                    .toList();
        }

        return jugadores.stream()
                .map(p -> toInventarioDTO(inventarioRepository.findByPersonajeId(p.getPersonaje().getId())))
                .toList();
    }

    @Transactional
    public InventarioDTO recibirItem(String email, Long misionId, AddItemInventarioDTO dto) {
        Usuario user = getUsuarioByEmail(email);
        MisionParticipante target = getParticipantePorPersonaje(misionId, dto.personajeId());
        validarPuedeRecibir(target);
        validarEntrega(user, misionId, target);

        String tipo = normalizeTipo(dto.tipo());
        Inventario inventario = upsertInventario(target.getPersonaje(), tipo, dto.itemId(), dto.cantidad());
        inventarioRepository.save(inventario);

        return toInventarioDTO(inventarioRepository.findByPersonajeId(target.getPersonaje().getId()));
    }

    @Transactional
    public InventarioDTO actualizarItem(String email, Long misionId, Long inventarioId, UpdateInventarioItemDTO dto) {
        Usuario user = getUsuarioByEmail(email);
        Inventario item = getInventarioById(inventarioId);
        MisionParticipante target = getParticipantePorPersonaje(misionId, item.getPersonaje().getId());

        validarUpdateDelete(user, misionId, target);

        item.setCantidad(dto.cantidad());
        if (dto.equipado() != null) {
            item.setEquipado(dto.equipado());
        }

        inventarioRepository.save(item);
        return toInventarioDTO(inventarioRepository.findByPersonajeId(item.getPersonaje().getId()));
    }

    @Transactional
    public void eliminarItem(String email, Long misionId, Long inventarioId) {
        Usuario user = getUsuarioByEmail(email);
        Inventario item = getInventarioById(inventarioId);
        MisionParticipante target = getParticipantePorPersonaje(misionId, item.getPersonaje().getId());

        validarUpdateDelete(user, misionId, target);
        inventarioRepository.delete(item);
    }

    private Inventario upsertInventario(Personaje personaje, String tipo, Long itemId, int cantidad) {
        return switch (tipo) {
            case "ARMA" -> upsertArma(personaje, itemId, cantidad);
            case "ARMADURA" -> upsertArmadura(personaje, itemId, cantidad);
            case "HECHIZO" -> upsertHechizo(personaje, itemId, cantidad);
            case "POCION" -> upsertPocion(personaje, itemId, cantidad);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de item invalido");
        };
    }

    private Inventario upsertArma(Personaje personaje, Long itemId, int cantidad) {
        Arma arma = armaRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Arma no encontrada"));

        Inventario inventario = inventarioRepository.findByPersonajeIdAndArmaId(personaje.getId(), itemId)
                .orElseGet(() -> Inventario.builder()
                        .personaje(personaje)
                        .tipo("ARMA")
                        .equipado(false)
                        .cantidad(0)
                        .arma(arma)
                        .build());

        inventario.setArma(arma);
        inventario.setCantidad(inventario.getCantidad() + cantidad);
        return inventario;
    }

    private Inventario upsertArmadura(Personaje personaje, Long itemId, int cantidad) {
        Armadura armadura = armaduraRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Armadura no encontrada"));

        Inventario inventario = inventarioRepository.findByPersonajeIdAndArmaduraId(personaje.getId(), itemId)
                .orElseGet(() -> Inventario.builder()
                        .personaje(personaje)
                        .tipo("ARMADURA")
                        .equipado(false)
                        .cantidad(0)
                        .armadura(armadura)
                        .build());

        inventario.setArmadura(armadura);
        inventario.setCantidad(inventario.getCantidad() + cantidad);
        return inventario;
    }

    private Inventario upsertHechizo(Personaje personaje, Long itemId, int cantidad) {
        Hechizo hechizo = hechizoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hechizo no encontrado"));

        Inventario inventario = inventarioRepository.findByPersonajeIdAndHechizoId(personaje.getId(), itemId)
                .orElseGet(() -> Inventario.builder()
                        .personaje(personaje)
                        .tipo("HECHIZO")
                        .equipado(false)
                        .cantidad(0)
                        .hechizo(hechizo)
                        .build());

        inventario.setHechizo(hechizo);
        inventario.setCantidad(inventario.getCantidad() + cantidad);
        return inventario;
    }

    private Inventario upsertPocion(Personaje personaje, Long itemId, int cantidad) {
        Pocion pocion = pocionRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pocion no encontrada"));

        Inventario inventario = inventarioRepository.findByPersonajeIdAndPocionId(personaje.getId(), itemId)
                .orElseGet(() -> Inventario.builder()
                        .personaje(personaje)
                        .tipo("POCION")
                        .equipado(false)
                        .cantidad(0)
                        .pocion(pocion)
                        .build());

        inventario.setPocion(pocion);
        inventario.setCantidad(inventario.getCantidad() + cantidad);
        return inventario;
    }

    private void validarPuedeRecibir(MisionParticipante target) {
        if (target.getRol() != RolParticipante.JUGADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo participantes JUGADOR pueden recibir items");
        }
    }

    private void validarEntrega(Usuario user, Long misionId, MisionParticipante target) {
        if (isAdmin(user)) {
            return;
        }

        MisionParticipante actor = getParticipanteActor(misionId, user.getId());
        if (actor.getRol() == RolParticipante.MASTER) {
            return;
        }

        boolean esSuPropioPersonaje = target.getUsuario().getId().equals(user.getId());
        if (!esSuPropioPersonaje || actor.getRol() != RolParticipante.JUGADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes entregar items a otros participantes");
        }
    }

    private void validarLecturaInventario(Usuario user, Long misionId, MisionParticipante target) {
        if (isAdmin(user)) {
            return;
        }

        MisionParticipante actor = getParticipanteActor(misionId, user.getId());
        if (actor.getRol() == RolParticipante.MASTER) {
            return;
        }

        boolean esSuPropioPersonaje = target.getUsuario().getId().equals(user.getId());
        if (!esSuPropioPersonaje) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes ver inventarios de otros jugadores");
        }
    }

    private void validarUpdateDelete(Usuario user, Long misionId, MisionParticipante target) {
        if (isAdmin(user)) {
            return;
        }

        MisionParticipante actor = getParticipanteActor(misionId, user.getId());
        if (actor.getRol() == RolParticipante.MASTER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MASTER solo puede ver y desplegar items");
        }

        boolean esSuPropioPersonaje = target.getUsuario().getId().equals(user.getId());
        if (!esSuPropioPersonaje) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes modificar inventarios de otros jugadores");
        }
    }

    private MisionParticipante getParticipanteActor(Long misionId, Long usuarioId) {
        return misionParticipanteRepository.findByMisionIdAndUsuarioId(misionId, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No participas en esta mision"));
    }

    private MisionParticipante getParticipanteActorSiNoAdmin(Usuario user, Long misionId) {
        if (isAdmin(user)) {
            return null;
        }
        return getParticipanteActor(misionId, user.getId());
    }

    private MisionParticipante getParticipantePorPersonaje(Long misionId, Long personajeId) {
        Personaje personaje = personajeRepository.findById(personajeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));

        return misionParticipanteRepository.findByMisionIdAndPersonajeId(misionId, personaje.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El personaje no participa en la mision"));
    }

    private Inventario getInventarioById(Long inventarioId) {
        return inventarioRepository.findById(inventarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item de inventario no encontrado"));
    }

    private String normalizeTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de item obligatorio");
        }
        return tipo.trim().toUpperCase();
    }

    private Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private boolean isAdmin(Usuario user) {
        if (user.getRole() == null || user.getRole().getNombre() == null) {
            return false;
        }
        String role = user.getRole().getNombre().toUpperCase().replace("ROLE_", "");
        return "ADMIN".equals(role);
    }

    private InventarioDTO toInventarioDTO(List<Inventario> items) {
        List<ArmaInventarioDTO> armas = items.stream()
                .filter(i -> i.getArma() != null)
                .map(i -> new ArmaInventarioDTO(i.getId(), i.getArma().getNombre(), i.getArma().getDamageDice(), i.getArma().getTipoDano(), i.getArma().getBonusAtaque(), i.getArma().getBonusDano(), i.getArma().getRareza(), i.isEquipado(), i.getCantidad()))
                .toList();

        List<ArmaduraInventarioDTO> armaduras = items.stream()
                .filter(i -> i.getArmadura() != null)
                .map(i -> new ArmaduraInventarioDTO(i.getId(), i.getArmadura().getNombre(), i.getArmadura().getCaBase(), i.getArmadura().getMaxDexBonus(), i.getArmadura().getBonusDefensa(), i.getArmadura().getRareza(), i.getArmadura().isSigiloDesventaja(), i.isEquipado(), i.getCantidad()))
                .toList();

        List<HechizoInventarioDTO> hechizos = items.stream()
                .filter(i -> i.getHechizo() != null)
                .map(i -> new HechizoInventarioDTO(i.getId(), i.getHechizo().getNombre(), i.getHechizo().getNivelHechizo(), i.getHechizo().getEscuela(), i.getHechizo().getDamageDice(), i.getHechizo().getTipoDano(), i.getHechizo().getCosteMana(), i.getHechizo().getRareza(), i.getHechizo().getAlcance(), i.getHechizo().getDuracion(), i.isEquipado(), i.getCantidad()))
                .toList();

        List<PocionInventarioDTO> pociones = items.stream()
                .filter(i -> i.getPocion() != null)
                .map(i -> new PocionInventarioDTO(i.getId(), i.getPocion().getNombre(), i.getPocion().getRecuperacionSalud(), i.getPocion().getRecuperacionMana(), i.getPocion().getRareza(), i.getPocion().getPrecioPo(), i.getCantidad()))
                .toList();

        return new InventarioDTO(armas, armaduras, hechizos, pociones);
    }
}

