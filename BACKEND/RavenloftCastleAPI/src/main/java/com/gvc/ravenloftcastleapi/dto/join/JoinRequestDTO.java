package com.gvc.ravenloftcastleapi.dto.join;

public class JoinRequestDTO {
    private String codigoInvitacion;
    private Long personajeId;

    public JoinRequestDTO() {}

    public JoinRequestDTO(String codigoInvitacion, Long personajeId) {
        this.codigoInvitacion = codigoInvitacion;
        this.personajeId = personajeId;
    }

    public String getCodigoInvitacion() { return codigoInvitacion; }
    public void setCodigoInvitacion(String codigoInvitacion) { this.codigoInvitacion = codigoInvitacion; }

    public Long getPersonajeId() { return personajeId; }
    public void setPersonajeId(Long personajeId) { this.personajeId = personajeId; }
}

