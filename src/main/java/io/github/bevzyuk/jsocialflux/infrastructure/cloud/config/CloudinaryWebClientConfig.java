package io.github.bevzyuk.jsocialflux.infrastructure.cloud.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties(CloudinaryProps.class)
public class CloudinaryWebClientConfig {

    @Bean
    public WebClient cloudinaryWebClient(WebClient.Builder builder,
                                         CloudinaryProps props) {
        return builder
                .baseUrl("https://api.cloudinary.com/v1_1/" + props.cloudName())
                .build();
    }

    @Bean
    public CloudinarySigner cloudinarySigner(CloudinaryProps props) {
        return new CloudinarySigner(props.apiSecret());
    }
}


