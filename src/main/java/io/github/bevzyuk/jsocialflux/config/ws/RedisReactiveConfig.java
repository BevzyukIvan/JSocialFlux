package io.github.bevzyuk.jsocialflux.config.ws;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.listener.ReactiveRedisMessageListenerContainer;

@Configuration
public class RedisReactiveConfig {
    @Bean
    ReactiveRedisMessageListenerContainer redisContainer(ReactiveRedisConnectionFactory cf) {
        return new ReactiveRedisMessageListenerContainer(cf);
    }
}
