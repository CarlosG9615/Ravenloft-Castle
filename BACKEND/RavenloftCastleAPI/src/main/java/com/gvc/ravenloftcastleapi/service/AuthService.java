package com.gvc.ravenloftcastleapi.service;

import com.gvc.ravenloftcastleapi.dto.autenticacion.LoginRequestDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.LoginResponseDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioCreateDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioResponseDTO;
import com.gvc.ravenloftcastleapi.entity.Role;
import com.gvc.ravenloftcastleapi.entity.Usuario;
import com.gvc.ravenloftcastleapi.exception.CredencialesInvalidasException;
import com.gvc.ravenloftcastleapi.repository.RoleRepository;
import com.gvc.ravenloftcastleapi.repository.UsuarioRepository;
import com.gvc.ravenloftcastleapi.repository.SuscripcionRepository;
import com.gvc.ravenloftcastleapi.entity.Suscripcion;
import java.time.LocalDate;
import com.gvc.ravenloftcastleapi.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;

    public UsuarioResponseDTO register(UsuarioCreateDTO dto) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new RuntimeException("Ya existe un usuario con ese email");
        }

        Role role = roleRepository.findByNombre("usuario")
                .orElseThrow(() -> new RuntimeException("Rol 'usuario' no encontrado en la base de datos"));

        String tokenActivacion = UUID.randomUUID().toString();

        Usuario nuevo = new Usuario();
        nuevo.setNombre(dto.nombre());
        nuevo.setEmail(dto.email());
        nuevo.setPassword(passwordEncoder.encode(dto.password()));
        nuevo.setRole(role);
        nuevo.setActivado(false);
        nuevo.setTokenActivacion(tokenActivacion);

        Usuario guardado = usuarioRepository.save(nuevo);

        Suscripcion suscripcionGratis = Suscripcion.builder()
                .usuario(guardado)
                .nombre("Aventurero")
                .tipo(com.gvc.ravenloftcastleapi.enums.TipoSuscripcion.BASICA)
                .estado("ACTIVA")
                .fechaAlta(LocalDate.now())
                .build();
        suscripcionRepository.save(suscripcionGratis);

        // Envío de correo
        String urlActivacion = "http://localhost:5173/activate?token=" + tokenActivacion;
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(guardado.getEmail());
        mensaje.setSubject("Activa tu cuenta de Ravenloft Castle");
        mensaje.setText("Para activar tu cuenta, haz clic en el siguiente enlace: \n" + urlActivacion);
        mailSender.send(mensaje);

        return new UsuarioResponseDTO(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getEmail(),
                guardado.getRole().getNombre(),
                guardado.getAvatar()
        );
    }

    public LoginResponseDTO login(LoginRequestDTO request) {

        // 1. Buscar usuario por email
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(CredencialesInvalidasException::new);

        if (!usuario.isActivado()) {
            throw new RuntimeException("Debe activar su cuenta revisando su correo electrónico");
        }

        // 2. Comparar password con el hash almacenado
        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw new CredencialesInvalidasException();
        }

        // 3. Generar JWT real
        String token = jwtService.generateToken(usuario);

        return new LoginResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRole().getNombre(),
                token
        );
    }

    public void activarCuenta(String token) {
        Usuario usuario = usuarioRepository.findByTokenActivacion(token)
                .orElseThrow(() -> new RuntimeException("Token de activación inválido"));

        usuario.setActivado(true);
        usuario.setTokenActivacion(null);
        usuarioRepository.save(usuario);
    }
}
