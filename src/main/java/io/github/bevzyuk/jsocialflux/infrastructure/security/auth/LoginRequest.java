package io.github.bevzyuk.jsocialflux.infrastructure.security.auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}
