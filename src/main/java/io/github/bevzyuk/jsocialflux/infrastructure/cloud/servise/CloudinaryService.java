package io.github.bevzyuk.jsocialflux.infrastructure.cloud.servise;

import io.github.bevzyuk.jsocialflux.infrastructure.cloud.config.CloudinarySigner;
import io.github.bevzyuk.jsocialflux.infrastructure.cloud.config.CloudinaryProps;
import io.github.bevzyuk.jsocialflux.infrastructure.cloud.model.UploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final WebClient cloudinaryWebClient;
    private final CloudinaryProps props;
    private final CloudinarySigner signer;

    public Mono<String> uploadImage(FilePart file,
                                    String folder,
                                    String publicIdPrefix) {

        long ts = Instant.now().getEpochSecond();
        String pid = publicIdPrefix + "_" + UUID.randomUUID();

        Map<String, String> sigParams = Map.of(
                "folder", folder,
                "public_id", pid,
                "timestamp", String.valueOf(ts)
        );
        String signature = signer.sign(sigParams);

        MultipartBodyBuilder mb = new MultipartBodyBuilder();
        mb.part("file", file);
        mb.part("folder", folder);
        mb.part("public_id", pid);
        mb.part("timestamp", ts);
        mb.part("signature", signature);
        mb.part("api_key", props.apiKey());

        return cloudinaryWebClient.post()
                .uri("/image/upload")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(mb.build()))
                .retrieve()
                .bodyToMono(UploadResponse.class)
                .map(UploadResponse::secureUrl);
    }

    public Mono<Void> deleteImage(String imageUrl) {

        String publicId = extractPublicId(imageUrl);

        long ts = Instant.now().getEpochSecond();
        Map<String, String> sigParams = Map.of(
                "invalidate", "true",
                "public_id",  publicId,
                "timestamp",  String.valueOf(ts)
        );
        String signature = signer.sign(sigParams);

        return cloudinaryWebClient.post()
                .uri("/image/destroy")
                .body(BodyInserters
                        .fromFormData("public_id",  publicId)
                        .with("invalidate", "true")
                        .with("timestamp",  String.valueOf(ts))
                        .with("signature",  signature)
                        .with("api_key",    props.apiKey()))
                .retrieve()
                .bodyToMono(Map.class)
                .then();
    }

    private String extractPublicId(String url) {
        String path = url.substring(url.indexOf("/upload/") + 8);

        while (path.contains("/") && path.substring(0, path.indexOf('/')).contains(",")) {
            path = path.substring(path.indexOf('/') + 1);
        }

        if (path.startsWith("v") && path.indexOf('/') > 0) {
            path = path.substring(path.indexOf('/') + 1);
        }

        return path.replaceAll("\\.[a-zA-Z0-9]+$", "");
    }
}

