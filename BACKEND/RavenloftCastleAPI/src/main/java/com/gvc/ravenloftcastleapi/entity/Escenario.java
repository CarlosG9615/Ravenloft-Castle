package com.gvc.ravenloftcastleapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "escenario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Escenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT UNSIGNED")
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, length = 50)
    private String objeto;

    @Column(nullable = false, length = 50)
    private String iluminacion;

    @Column(nullable = false, length = 50)
    private String terreno;

    @OneToMany(mappedBy = "escenario")
    private List<MisionEscenario> misiones;
}


