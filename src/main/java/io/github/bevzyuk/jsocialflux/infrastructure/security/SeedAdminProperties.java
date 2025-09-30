package io.github.bevzyuk.jsocialflux.infrastructure.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed-admin")
public record SeedAdminProperties(
        String username,
        String password
) {}
