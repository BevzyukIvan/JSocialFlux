package io.github.bevzyuk.jsocialflux;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public Mono<String> health() {
        return Mono.just("OK!!!");
    }
}
