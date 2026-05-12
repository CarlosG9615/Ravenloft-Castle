package com.gvc.ravenloftcastleapi.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mensaje_chat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensajeChatPersistido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mision_id", nullable = false)
    private Long misionId;

    @Column(name = "personaje_id")
    private Long personajeId;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(length = 150)
    private String autor;

    @Column(name = "color_autor", length = 30)
    private String colorAutor;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Builder.Default
    @Column(name = "contenido", columnDefinition = "TEXT")
    private String contenido = "";

    @Column(length = 20)
    private String tipo;

    @Column(length = 20)
    private String timestamp;

    @Column(name = "tirada_dado", length = 20)
    private String tiradaDado;

    @Column(name = "tirada_resultado")
    private Integer tiradaResultado;

    @Column(name = "tirada_modificador")
    private Integer tiradaModificador;

    @Column(name = "tirada_total")
    private Integer tiradaTotal;

    @Column(name = "tirada_imagenes", length = 500)
    private String tiradaImagenes;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;
}
