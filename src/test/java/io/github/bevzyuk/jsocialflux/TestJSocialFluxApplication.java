package io.github.bevzyuk.jsocialflux;

import org.springframework.boot.SpringApplication;

public class TestJSocialFluxApplication {

    public static void main(String[] args) {
        SpringApplication.from(JSocialFluxApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
