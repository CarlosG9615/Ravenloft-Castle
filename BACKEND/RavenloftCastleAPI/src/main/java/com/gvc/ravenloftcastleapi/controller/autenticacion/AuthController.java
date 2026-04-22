package com.gvc.ravenloftcastleapi.controller.autenticacion;

import com.gvc.ravenloftcastleapi.dto.autenticacion.LoginRequestDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.LoginResponseDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioCreateDTO;
import com.gvc.ravenloftcastleapi.dto.autenticacion.UsuarioResponseDTO;
import com.gvc.ravenloftcastleapi.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponseDTO> register(@Valid @RequestBody UsuarioCreateDTO dto) {
        UsuarioResponseDTO response = authService.register(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/activar")
    public ResponseEntity<String> activarCuenta(@RequestParam("token") String token) {
        try {
            authService.activarCuenta(token);
            return ResponseEntity.ok("Cuenta activada correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
