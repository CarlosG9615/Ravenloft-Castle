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
import com.gvc.ravenloftcastleapi.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UsuarioResponseDTO register(UsuarioCreateDTO dto) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new RuntimeException("Ya existe un usuario con ese email");
        }

        Role role = roleRepository.findByNombre("usuario")
                .orElseThrow(() -> new RuntimeException("Rol 'usuario' no encontrado en la base de datos"));

        Usuario nuevo = Usuario.builder()
                .nombre(dto.nombre())
                .email(dto.email())
                .password(passwordEncoder.encode(dto.password()))
                .role(role)
                .build();

        Usuario guardado = usuarioRepository.save(nuevo);

        return new UsuarioResponseDTO(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getEmail(),
                guardado.getRole().getNombre()
        );
    }

    public LoginResponseDTO login(LoginRequestDTO request) {

        // 1. Buscar usuario por email
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(CredencialesInvalidasException::new);

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
}

