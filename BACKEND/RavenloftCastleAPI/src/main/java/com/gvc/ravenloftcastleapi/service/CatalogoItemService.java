package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.inventario.ArmaDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.ArmaduraDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.HechizoDTO;
import com.gvc.ravenloftcastleapi.dto.inventario.PocionDTO;
import com.gvc.ravenloftcastleapi.entity.Arma;
import com.gvc.ravenloftcastleapi.entity.Armadura;
import com.gvc.ravenloftcastleapi.entity.Hechizo;
import com.gvc.ravenloftcastleapi.entity.Pocion;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.ArmaRepository;
import com.gvc.ravenloftcastleapi.repository.ArmaduraRepository;
import com.gvc.ravenloftcastleapi.repository.HechizoRepository;
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
public class CatalogoItemService {

    private final ArmaRepository armaRepository;
    private final ArmaduraRepository armaduraRepository;
    private final HechizoRepository hechizoRepository;
    private final PocionRepository pocionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<ArmaDTO> listarArmas() {
        return armaRepository.findAll().stream().map(this::toArmaDTO).toList();
    }

    @Transactional(readOnly = true)
    public ArmaDTO getArma(Long id) {
        return toArmaDTO(getArmaEntity(id));
    }

    @Transactional
    public ArmaDTO crearArma(String email, ArmaDTO dto) {
        validarAdmin(email);
        Arma arma = Arma.builder()
                .nombre(dto.nombre())
                .descripcion(dto.descripcion())
                .damageDice(dto.damageDice())
                .tipoDano(dto.tipoDano())
                .bonusAtaque(dto.bonusAtaque())
                .bonusDano(dto.bonusDano())
                .rareza(dto.rareza())
                .tipoPermitido(dto.tipoPermitido())
                .nivelMin(dto.nivelMin())
                .propiedades(dto.propiedades())
                .build();
        return toArmaDTO(armaRepository.save(arma));
    }

    @Transactional
    public ArmaDTO actualizarArma(String email, Long id, ArmaDTO dto) {
        validarAdmin(email);
        Arma arma = getArmaEntity(id);
        arma.setNombre(dto.nombre());
        arma.setDescripcion(dto.descripcion());
        arma.setDamageDice(dto.damageDice());
        arma.setTipoDano(dto.tipoDano());
        arma.setBonusAtaque(dto.bonusAtaque());
        arma.setBonusDano(dto.bonusDano());
        arma.setRareza(dto.rareza());
        arma.setTipoPermitido(dto.tipoPermitido());
        arma.setNivelMin(dto.nivelMin());
        arma.setPropiedades(dto.propiedades());
        return toArmaDTO(armaRepository.save(arma));
    }

    @Transactional
    public void eliminarArma(String email, Long id) {
        validarAdmin(email);
        Arma arma = getArmaEntity(id);
        armaRepository.delete(arma);
    }

    @Transactional(readOnly = true)
    public List<ArmaduraDTO> listarArmaduras() {
        return armaduraRepository.findAll().stream().map(this::toArmaduraDTO).toList();
    }

    @Transactional(readOnly = true)
    public ArmaduraDTO getArmadura(Long id) {
        return toArmaduraDTO(getArmaduraEntity(id));
    }

    @Transactional
    public ArmaduraDTO crearArmadura(String email, ArmaduraDTO dto) {
        validarAdmin(email);
        Armadura armadura = Armadura.builder()
                .nombre(dto.nombre())
                .descripcion(dto.descripcion())
                .caBase(dto.caBase())
                .maxDexBonus(dto.maxDexBonus())
                .bonusDefensa(dto.bonusDefensa())
                .rareza(dto.rareza())
                .tipoPermitido(dto.tipoPermitido())
                .nivelMin(dto.nivelMin())
                .requiereFuerza(dto.requiereFuerza())
                .sigiloDesventaja(dto.sigiloDesventaja())
                .build();
        return toArmaduraDTO(armaduraRepository.save(armadura));
    }

    @Transactional
    public ArmaduraDTO actualizarArmadura(String email, Long id, ArmaduraDTO dto) {
        validarAdmin(email);
        Armadura armadura = getArmaduraEntity(id);
        armadura.setNombre(dto.nombre());
        armadura.setDescripcion(dto.descripcion());
        armadura.setCaBase(dto.caBase());
        armadura.setMaxDexBonus(dto.maxDexBonus());
        armadura.setBonusDefensa(dto.bonusDefensa());
        armadura.setRareza(dto.rareza());
        armadura.setTipoPermitido(dto.tipoPermitido());
        armadura.setNivelMin(dto.nivelMin());
        armadura.setRequiereFuerza(dto.requiereFuerza());
        armadura.setSigiloDesventaja(dto.sigiloDesventaja());
        return toArmaduraDTO(armaduraRepository.save(armadura));
    }

    @Transactional
    public void eliminarArmadura(String email, Long id) {
        validarAdmin(email);
        Armadura armadura = getArmaduraEntity(id);
        armaduraRepository.delete(armadura);
    }

    @Transactional(readOnly = true)
    public List<HechizoDTO> listarHechizos() {
        return hechizoRepository.findAll().stream().map(this::toHechizoDTO).toList();
    }

    @Transactional(readOnly = true)
    public HechizoDTO getHechizo(Long id) {
        return toHechizoDTO(getHechizoEntity(id));
    }

    @Transactional
    public HechizoDTO crearHechizo(String email, HechizoDTO dto) {
        validarAdmin(email);
        Hechizo hechizo = Hechizo.builder()
                .nombre(dto.nombre())
                .descripcion(dto.descripcion())
                .nivelHechizo(dto.nivelHechizo())
                .escuela(dto.escuela())
                .damageDice(dto.damageDice())
                .tipoDano(dto.tipoDano())
                .costeMana(dto.costeMana())
                .rareza(dto.rareza())
                .tipoPermitido(dto.tipoPermitido())
                .nivelMin(dto.nivelMin())
                .alcance(dto.alcance())
                .duracion(dto.duracion())
                .build();
        return toHechizoDTO(hechizoRepository.save(hechizo));
    }

    @Transactional
    public HechizoDTO actualizarHechizo(String email, Long id, HechizoDTO dto) {
        validarAdmin(email);
        Hechizo hechizo = getHechizoEntity(id);
        hechizo.setNombre(dto.nombre());
        hechizo.setDescripcion(dto.descripcion());
        hechizo.setNivelHechizo(dto.nivelHechizo());
        hechizo.setEscuela(dto.escuela());
        hechizo.setDamageDice(dto.damageDice());
        hechizo.setTipoDano(dto.tipoDano());
        hechizo.setCosteMana(dto.costeMana());
        hechizo.setRareza(dto.rareza());
        hechizo.setTipoPermitido(dto.tipoPermitido());
        hechizo.setNivelMin(dto.nivelMin());
        hechizo.setAlcance(dto.alcance());
        hechizo.setDuracion(dto.duracion());
        return toHechizoDTO(hechizoRepository.save(hechizo));
    }

    @Transactional
    public void eliminarHechizo(String email, Long id) {
        validarAdmin(email);
        Hechizo hechizo = getHechizoEntity(id);
        hechizoRepository.delete(hechizo);
    }

    @Transactional(readOnly = true)
    public List<PocionDTO> listarPociones() {
        return pocionRepository.findAll().stream().map(this::toPocionDTO).toList();
    }

    @Transactional(readOnly = true)
    public PocionDTO getPocion(Long id) {
        return toPocionDTO(getPocionEntity(id));
    }

    @Transactional
    public PocionDTO crearPocion(String email, PocionDTO dto) {
        validarAdmin(email);
        Pocion pocion = Pocion.builder()
                .nombre(dto.nombre())
                .descripcion(dto.descripcion())
                .recuperacionSalud(dto.recuperacionSalud())
                .recuperacionMana(dto.recuperacionMana())
                .rareza(dto.rareza())
                .precioPo(dto.precioPo())
                .build();
        return toPocionDTO(pocionRepository.save(pocion));
    }

    @Transactional
    public PocionDTO actualizarPocion(String email, Long id, PocionDTO dto) {
        validarAdmin(email);
        Pocion pocion = getPocionEntity(id);
        pocion.setNombre(dto.nombre());
        pocion.setDescripcion(dto.descripcion());
        pocion.setRecuperacionSalud(dto.recuperacionSalud());
        pocion.setRecuperacionMana(dto.recuperacionMana());
        pocion.setRareza(dto.rareza());
        pocion.setPrecioPo(dto.precioPo());
        return toPocionDTO(pocionRepository.save(pocion));
    }

    @Transactional
    public void eliminarPocion(String email, Long id) {
        validarAdmin(email);
        Pocion pocion = getPocionEntity(id);
        pocionRepository.delete(pocion);
    }

    private void validarAdmin(String email) {
        Usuario user = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (user.getRole() == null || user.getRole().getNombre() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos de administrador");
        }
        String role = user.getRole().getNombre().toUpperCase().replace("ROLE_", "");
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos de administrador");
        }
    }

    private Arma getArmaEntity(Long id) {
        return armaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Arma no encontrada"));
    }

    private Armadura getArmaduraEntity(Long id) {
        return armaduraRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Armadura no encontrada"));
    }

    private Hechizo getHechizoEntity(Long id) {
        return hechizoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hechizo no encontrado"));
    }

    private Pocion getPocionEntity(Long id) {
        return pocionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pocion no encontrada"));
    }

    private ArmaDTO toArmaDTO(Arma a) {
        return new ArmaDTO(a.getId(), a.getNombre(), a.getDescripcion(), a.getDamageDice(), a.getTipoDano(), a.getBonusAtaque(), a.getBonusDano(), a.getRareza(), a.getTipoPermitido(), a.getNivelMin(), a.getPropiedades());
    }

    private ArmaduraDTO toArmaduraDTO(Armadura a) {
        return new ArmaduraDTO(a.getId(), a.getNombre(), a.getDescripcion(), a.getCaBase(), a.getMaxDexBonus(), a.getBonusDefensa(), a.getRareza(), a.getTipoPermitido(), a.getNivelMin(), a.getRequiereFuerza(), a.isSigiloDesventaja());
    }

    private HechizoDTO toHechizoDTO(Hechizo h) {
        return new HechizoDTO(h.getId(), h.getNombre(), h.getDescripcion(), h.getNivelHechizo(), h.getEscuela(), h.getDamageDice(), h.getTipoDano(), h.getCosteMana(), h.getRareza(), h.getTipoPermitido(), h.getNivelMin(), h.getAlcance(), h.getDuracion());
    }

    private PocionDTO toPocionDTO(Pocion p) {
        return new PocionDTO(p.getId(), p.getNombre(), p.getDescripcion(), p.getRecuperacionSalud(), p.getRecuperacionMana(), p.getRareza(), p.getPrecioPo());
    }
}

