package com.gvc.ravenloftcastleapi.dto.personaje;

public class PersonajeResponseDTO {

    private Long id;
    private String nombre;
    private int nivel;
    private Long razaId;
    private Long claseId;

    public PersonajeResponseDTO() {}

    public PersonajeResponseDTO(Long id, String nombre, int nivel, Long razaId, Long claseId) {
        this.id = id;
        this.nombre = nombre;
        this.nivel = nivel;
        this.razaId = razaId;
        this.claseId = claseId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }

    public Long getRazaId() { return razaId; }
    public void setRazaId(Long razaId) { this.razaId = razaId; }

    public Long getClaseId() { return claseId; }
    public void setClaseId(Long claseId) { this.claseId = claseId; }
}

