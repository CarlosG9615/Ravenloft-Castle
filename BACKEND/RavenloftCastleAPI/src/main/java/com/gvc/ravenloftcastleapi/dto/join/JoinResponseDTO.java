package com.gvc.ravenloftcastleapi.dto.join;

public class JoinResponseDTO {
    private String message;

    public JoinResponseDTO() {}

    public JoinResponseDTO(String message) { this.message = message; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

