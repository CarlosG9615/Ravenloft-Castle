package com.gvc.ravenloftcastleapi.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults()) // Enable CORS
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/ws/**").permitAll()
                    .requestMatchers("/ws/info/**").permitAll()
                    .requestMatchers("/ws/info").permitAll()
                    .requestMatchers(HttpMethod.GET ,"/api/usuarios/**").permitAll()
                    .requestMatchers(HttpMethod.GET ,"/api/modos-historia/**").permitAll()
                    .requestMatchers(HttpMethod.GET ,"/api/misiones/*/participantes/**").permitAll()
                    .requestMatchers(HttpMethod.DELETE, "/api/campanas/**").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/modos-historia/*/codigo-invitacion").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/modos-historia/*/codigo-invitacion/generar").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/modos-historia").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/modos-historia/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/modos-historia/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/escenarios").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/escenarios/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/escenarios/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/inventario/items/armas").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/inventario/items/armas/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/inventario/items/armas/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/inventario/items/armaduras").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/inventario/items/armaduras/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/inventario/items/armaduras/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/inventario/items/hechizos").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/inventario/items/hechizos/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/inventario/items/hechizos/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/inventario/items/pociones").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/inventario/items/pociones/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/inventario/items/pociones/*").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
