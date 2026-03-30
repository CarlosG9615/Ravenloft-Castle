package com.gvc.ravenloftcastleapi.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
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

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults()) // Enable CORS
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers(HttpMethod.GET ,"/api/usuarios/**").permitAll()
                    .requestMatchers(HttpMethod.GET ,"/api/campanas/**").permitAll()
                    .requestMatchers(HttpMethod.PUT, "/api/campanas/*/codigo-invitacion").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/campanas/*/codigo-invitacion/generar").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/campanas").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/campanas/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/campanas/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/misiones").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/misiones/*/escenarios").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/misiones/*/escenarios/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/misiones/*/escenarios/*/dificultad").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/misiones/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/misiones/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/escenarios").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/escenarios/*").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/escenarios/*").hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173")); // Allow frontend origin
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
