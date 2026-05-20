package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.catalogo.ClaseResumenDTO;
import com.gvc.ravenloftcastleapi.dto.catalogo.RazaResumenDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeCreateDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeCreacionConfigDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.PersonajeResponseDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.StatsBaseDTO;
import com.gvc.ravenloftcastleapi.dto.personaje.StatsDTO;
import com.gvc.ravenloftcastleapi.entity.Clase;
import com.gvc.ravenloftcastleapi.entity.Habilidad;
import com.gvc.ravenloftcastleapi.entity.Personaje;
import com.gvc.ravenloftcastleapi.entity.Raza;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.repository.ClaseRepository;
import com.gvc.ravenloftcastleapi.repository.PersonajeRepository;
import com.gvc.ravenloftcastleapi.repository.RazaRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class PersonajeService {

    private static final int ATRIBUTO_BASE_MIN = 8;
    private static final int ATRIBUTO_BASE_MAX = 15;
    private static final int ATRIBUTO_BASE_INICIAL = 10;
    private static final int PUNTOS_EXTRA_A_REPARTIR = 15;
    private static final int TOTAL_BASE_PERMITIDO = (ATRIBUTO_BASE_INICIAL * 6) + PUNTOS_EXTRA_A_REPARTIR;
    private static final int NIVEL_MIN = 1;
    private static final int NIVEL_MAX = 20;

    private final PersonajeRepository personajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClaseRepository claseRepository;
    private final RazaRepository razaRepository;

    @Transactional(readOnly = true)
    public PersonajeCreacionConfigDTO getCreationConfig() {
        List<RazaResumenDTO> razas = razaRepository.findAll().stream()
                .map(this::toRazaResumen)
                .toList();

        List<ClaseResumenDTO> clases = claseRepository.findAll().stream()
                .map(this::toClaseResumen)
                .toList();

        Map<Integer, Integer> bonificacionPorNivel = IntStream.rangeClosed(NIVEL_MIN, NIVEL_MAX)
                .boxed()
                .collect(Collectors.toMap(nivel -> nivel, this::computeProficiencyByLevel));

        return PersonajeCreacionConfigDTO.builder()
                .puntosBasePorAtributo(ATRIBUTO_BASE_INICIAL)
                .puntosExtraParaRepartir(PUNTOS_EXTRA_A_REPARTIR)
                .totalBasePermitido(TOTAL_BASE_PERMITIDO)
                .minimoAtributoBase(ATRIBUTO_BASE_MIN)
                .maximoAtributoBase(ATRIBUTO_BASE_MAX)
                .nivelMinimo(NIVEL_MIN)
                .nivelMaximo(NIVEL_MAX)
                .formulaSaludMaxima("(dadoGolpe + CON) + (nivel-1) * ((dadoGolpe/2 + 1) + CON)")
                .bonificacionCompetenciaPorNivel(bonificacionPorNivel)
                .razas(razas)
                .clases(clases)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PersonajeResponseDTO> listByUserEmail(String email) {
        Usuario user = getUsuarioByEmail(email);
        return personajeRepository.findByUsuarioId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PersonajeResponseDTO> listByUsuarioIdForCurrentUser(String email, Long usuarioId) {
        Usuario user = getUsuarioByEmail(email);
        validateOwnership(user, usuarioId);
        return personajeRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PersonajeResponseDTO getOneByUserEmail(String email, Long id) {
        Usuario user = getUsuarioByEmail(email);
        Personaje personaje = personajeRepository.findByIdAndUsuarioId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));
        return toResponse(personaje);
    }

    @Transactional
    public PersonajeResponseDTO createForUserEmail(String email, PersonajeCreateDTO dto) {
        Usuario user = getUsuarioByEmail(email);
        validateOwnership(user, dto.getUsuarioId());
        validateBaseStats(dto.getStatsBase());

        Clase clase = getClaseByNombre(dto.getClase());
        Raza raza = getRazaByNombre(dto.getRaza());
        validateLevel(dto.getNivel());

        StatsDTO finalStats = dto.getStatsFinales();
        int puntosGolpeMax = computeMaxHitPoints(clase.getDadoGolpe(), finalStats.constitucion(), dto.getNivel());
        int puntosGolpeActual = dto.getPuntosGolpeActual() == null ? puntosGolpeMax : dto.getPuntosGolpeActual();
        validateCurrentHitPoints(puntosGolpeActual, puntosGolpeMax);

        Personaje personaje = Personaje.builder()
                .usuario(user)
                .nombre(dto.getNombre())
                .clase(clase)
                .raza(raza)
                .nivel(dto.getNivel())
                .experiencia(0)
                .puntosGolpeMax(puntosGolpeMax)
                .puntosGolpeActual(puntosGolpeActual)
                .fuerza(finalStats.fuerza())
                .destreza(finalStats.destreza())
                .constitucion(finalStats.constitucion())
                .inteligencia(finalStats.inteligencia())
                .sabiduria(finalStats.sabiduria())
                .carisma(finalStats.carisma())
                .claseArmadura(dto.getClaseArmadura())
                .iniciativa(dto.getIniciativa())
                .velocidad(dto.getVelocidad())
                .bonificacionCompetencia(computeProficiencyByLevel(dto.getNivel()))
                .avatar(dto.getAvatar())
                .alineamiento(dto.getAlineamiento())
                .build();

        personaje.setHabilidad(toHabilidadEntity(dto, personaje));

        return toResponse(personajeRepository.save(personaje));
    }

    @Transactional
    public PersonajeResponseDTO updateForUserEmail(String email, Long id, PersonajeCreateDTO dto) {
        Usuario user = getUsuarioByEmail(email);
        validateOwnership(user, dto.getUsuarioId());
        validateBaseStats(dto.getStatsBase());
        validateLevel(dto.getNivel());

        Personaje personaje = personajeRepository.findByIdAndUsuarioId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));

        Clase clase = getClaseByNombre(dto.getClase());
        Raza raza = getRazaByNombre(dto.getRaza());
        StatsDTO finalStats = dto.getStatsFinales();

        int puntosGolpeMax = computeMaxHitPoints(clase.getDadoGolpe(), finalStats.constitucion(), dto.getNivel());
        int puntosGolpeActual = dto.getPuntosGolpeActual() == null ? Math.min(personaje.getPuntosGolpeActual(), puntosGolpeMax) : dto.getPuntosGolpeActual();
        validateCurrentHitPoints(puntosGolpeActual, puntosGolpeMax);

        personaje.setNombre(dto.getNombre());
        personaje.setClase(clase);
        personaje.setRaza(raza);
        personaje.setNivel(dto.getNivel());
        personaje.setPuntosGolpeMax(puntosGolpeMax);
        personaje.setPuntosGolpeActual(puntosGolpeActual);
        personaje.setFuerza(finalStats.fuerza());
        personaje.setDestreza(finalStats.destreza());
        personaje.setConstitucion(finalStats.constitucion());
        personaje.setInteligencia(finalStats.inteligencia());
        personaje.setSabiduria(finalStats.sabiduria());
        personaje.setCarisma(finalStats.carisma());
        personaje.setClaseArmadura(dto.getClaseArmadura());
        personaje.setIniciativa(dto.getIniciativa());
        personaje.setVelocidad(dto.getVelocidad());
        personaje.setBonificacionCompetencia(computeProficiencyByLevel(dto.getNivel()));
        personaje.setAvatar(dto.getAvatar());
        personaje.setAlineamiento(dto.getAlineamiento());

        if (personaje.getHabilidad() == null) {
            personaje.setHabilidad(toHabilidadEntity(dto, personaje));
        } else {
            updateHabilidadEntity(dto, personaje.getHabilidad());
        }

        return toResponse(personajeRepository.save(personaje));
    }

    @Transactional
    public void deleteForUserEmail(String email, Long id) {
        Usuario currentUser = getUsuarioByEmail(email);
        Personaje personaje = personajeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaje no encontrado"));

        boolean isOwner = personaje.getUsuario().getId().equals(currentUser.getId());
        if (!isAdmin(currentUser) && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes eliminar personajes de otro usuario");
        }

        personajeRepository.delete(personaje);
    }

    private Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private void validateOwnership(Usuario user, Long usuarioId) {
        if (!user.getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes operar personajes de otro usuario");
        }
    }

    private boolean isAdmin(Usuario user) {
        if (user.getRole() == null || user.getRole().getNombre() == null) {
            return false;
        }
        String roleName = user.getRole().getNombre().toUpperCase().replace("ROLE_", "");
        return "ADMIN".equals(roleName);
    }

    private void validateBaseStats(StatsBaseDTO statsBase) {
        int total = statsBase.fuerza()
                + statsBase.destreza()
                + statsBase.constitucion()
                + statsBase.inteligencia()
                + statsBase.sabiduria()
                + statsBase.carisma();

        if (total != TOTAL_BASE_PERMITIDO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La suma de stats base debe ser exactamente " + TOTAL_BASE_PERMITIDO
            );
        }
    }

    private void validateLevel(Integer nivel) {
        if (nivel == null || nivel < NIVEL_MIN || nivel > NIVEL_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nivel invalido. Rango permitido: " + NIVEL_MIN + "-" + NIVEL_MAX);
        }
    }

    private void validateCurrentHitPoints(int puntosGolpeActual, int puntosGolpeMax) {
        if (puntosGolpeActual > puntosGolpeMax) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los puntos de golpe actuales no pueden superar los máximos");
        }
        if (puntosGolpeActual < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los puntos de golpe actuales no pueden ser negativos");
        }
    }

    private Clase getClaseByNombre(String nombreClase) {
        return claseRepository.findByNombreIgnoreCase(nombreClase.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clase no encontrada: " + nombreClase));
    }

    private Raza getRazaByNombre(String nombreRaza) {
        return razaRepository.findByNombreIgnoreCase(nombreRaza.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Raza no encontrada: " + nombreRaza));
    }

    private int computeMaxHitPoints(int dadoGolpe, int constitucion, int nivel) {
        int nivelUno = dadoGolpe + constitucion;
        if (nivel <= 1) {
            return nivelUno;
        }

        int incrementoPorNivel = (dadoGolpe / 2) + 1 + constitucion;
        return nivelUno + ((nivel - 1) * incrementoPorNivel);
    }

    private int computeProficiencyByLevel(int nivel) {
        if (nivel <= 4) {
            return 2;
        }
        if (nivel <= 8) {
            return 3;
        }
        if (nivel <= 12) {
            return 4;
        }
        if (nivel <= 16) {
            return 5;
        }
        return 6;
    }

    private Habilidad toHabilidadEntity(PersonajeCreateDTO dto, Personaje personaje) {
        Habilidad habilidad = Habilidad.builder()
                .personaje(personaje)
                .atletismo(dto.getHabilidades().atletismo())
                .sigilo(dto.getHabilidades().sigilo())
                .persuasion(dto.getHabilidades().persuasion())
                .percepcion(dto.getHabilidades().percepcion())
                .arcanos(dto.getHabilidades().arcanos())
                .medicina(dto.getHabilidades().medicina())
                .supervivencia(dto.getHabilidades().supervivencia())
                .intimidad(dto.getHabilidades().intimidacion())
                .build();

        habilidad.setAcrobacias(0);
        habilidad.setEnganar(0);
        habilidad.setHistoria(0);
        habilidad.setInterpretacion(0);
        habilidad.setInvestigacion(0);
        habilidad.setJuegoDeManos(0);
        habilidad.setNaturaleza(0);
        habilidad.setPerspicacia(0);
        habilidad.setReligion(0);
        habilidad.setTratoConAnimales(0);
        return habilidad;
    }

    private void updateHabilidadEntity(PersonajeCreateDTO dto, Habilidad habilidad) {
        habilidad.setAtletismo(dto.getHabilidades().atletismo());
        habilidad.setSigilo(dto.getHabilidades().sigilo());
        habilidad.setPersuasion(dto.getHabilidades().persuasion());
        habilidad.setPercepcion(dto.getHabilidades().percepcion());
        habilidad.setArcanos(dto.getHabilidades().arcanos());
        habilidad.setMedicina(dto.getHabilidades().medicina());
        habilidad.setSupervivencia(dto.getHabilidades().supervivencia());
        habilidad.setIntimidad(dto.getHabilidades().intimidacion());
    }

    private RazaResumenDTO toRazaResumen(Raza raza) {
        return new RazaResumenDTO(
                raza.getId(),
                raza.getNombre(),
                raza.getDescripcion(),
                raza.getVelocidad(),
                new StatsDTO(
                        raza.getBonusStr(),
                        raza.getBonusDex(),
                        raza.getBonusCon(),
                        raza.getBonusIng(),
                        raza.getBonusWis(),
                        raza.getBonusCha()
                )
        );
    }

    private ClaseResumenDTO toClaseResumen(Clase clase) {
        return new ClaseResumenDTO(
                clase.getId(),
                clase.getNombre(),
                clase.getDescripcion(),
                clase.getDadoGolpe(),
                clase.getStatPrincipal(),
                clase.getArmaduraPermitida(),
                clase.getCaracteristicaClase()
        );
    }

    private PersonajeResponseDTO toResponse(Personaje personaje) {
        return PersonajeResponseDTO.builder()
                .id(personaje.getId())
                .nombre(personaje.getNombre())
                .clase(personaje.getClase().getNombre())
                .raza(personaje.getRaza().getNombre())
                .nivel(personaje.getNivel())
                .fuerza(personaje.getFuerza())
                .destreza(personaje.getDestreza())
                .constitucion(personaje.getConstitucion())
                .inteligencia(personaje.getInteligencia())
                .sabiduria(personaje.getSabiduria())
                .carisma(personaje.getCarisma())
                .puntosGolpeMax(personaje.getPuntosGolpeMax())
                .puntosGolpeActual(personaje.getPuntosGolpeActual())
                .claseArmadura(personaje.getClaseArmadura())
                .iniciativa(personaje.getIniciativa())
                .velocidad(personaje.getVelocidad())
                .bonificacionCompetencia(personaje.getBonificacionCompetencia())
                .avatar(personaje.getAvatar())
                .alineamiento(personaje.getAlineamiento())
                .usuarioId(personaje.getUsuario().getId())
                .build();
    }
}
