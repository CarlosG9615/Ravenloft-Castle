package com.gvc.ravenloftcastleapi.security;

import java.util.List;

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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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
                    .requestMatchers(HttpMethod.POST, "/api/misiones").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/misiones/*/escenarios").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/misiones/*/escenarios/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/misiones/*/escenarios/*/dificultad").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/misiones/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/misiones/*").hasRole("ADMIN")
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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5170", "http://localhost:5171", "http://localhost:5172", 
            "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
            "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", 
            "http://localhost:5179"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
