package io.github.bevzyuk.jsocialflux;

import io.github.bevzyuk.jsocialflux.infrastructure.security.SeedAdminProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(SeedAdminProperties.class)
public class JSocialFluxApplication {

    public static void main(String[] args) {
        SpringApplication.run(JSocialFluxApplication.class, args);
    }

}
